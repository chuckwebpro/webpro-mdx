mod credentials;
mod github;
mod import_webpro;

use chrono::Utc;
use credentials::{clear_github_token, has_github_token, load_github_token, save_github_token};
use github::{
    fetch_seo_insights_image, fetch_seo_insights_mdx, list_seo_insights_mdx_files,
    GitHubConnectionStatus, PublishFile, PublishResult,
};
use import_webpro::{
    create_draft_from_webpro_mdx, import_webpro_slugs, list_local_webpro_articles,
    resolve_webpro_paths, summary_from_mdx, ImageSource, ImportWebproResult, LocalImageSource,
    MemoryImageSource, WebproArticleSummary,
};
use std::collections::HashSet;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipWriter};

const SETTINGS_FILE: &str = "settings.json";
const DEFAULT_DRAFTS_FOLDER: &str = "WebproArticles";
const DEFAULT_GITHUB_OWNER: &str = "chuckwebpro";
const DEFAULT_GITHUB_REPO: &str = "webpro";
const DEFAULT_GITHUB_BRANCH: &str = "main";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub drafts_dir: String,
    #[serde(default = "default_github_owner")]
    pub github_owner: String,
    #[serde(default = "default_github_repo")]
    pub github_repo: String,
    #[serde(default = "default_github_branch")]
    pub github_branch: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub github_username: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub webpro_local_path: Option<String>,
}

fn default_github_owner() -> String {
    DEFAULT_GITHUB_OWNER.to_string()
}

fn default_github_repo() -> String {
    DEFAULT_GITHUB_REPO.to_string()
}

fn default_github_branch() -> String {
    DEFAULT_GITHUB_BRANCH.to_string()
}

impl Default for AppSettings {
    fn default() -> Self {
        let home = dirs_fallback();
        Self {
            drafts_dir: home
                .join("Documents")
                .join(DEFAULT_DRAFTS_FOLDER)
                .to_string_lossy()
                .into_owned(),
            github_owner: default_github_owner(),
            github_repo: default_github_repo(),
            github_branch: default_github_branch(),
            github_username: None,
            webpro_local_path: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DraftSummary {
    pub slug: String,
    pub title: String,
    pub publish_date: String,
    pub draft: bool,
    pub last_edited: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DraftMeta {
    pub slug: String,
    pub title: String,
    pub dek: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub eyebrow: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub byline: Option<String>,
    pub publish_date: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_date: Option<String>,
    #[serde(default)]
    pub draft: bool,
    #[serde(default = "default_byline_author")]
    pub author: String,
    #[serde(default = "default_company")]
    pub company: String,
    #[serde(default = "default_location")]
    pub location: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub crescendo_heading: Option<String>,
    #[serde(default)]
    pub crescendo_body: Vec<String>,
    pub last_edited: String,
}

fn default_byline_author() -> String {
    "Bennie Warshaw".to_string()
}

fn default_company() -> String {
    "WEBPRO International Inc.".to_string()
}

fn default_location() -> String {
    "Savannah, GA".to_string()
}

const DEFAULT_EYEBROW: &str = "A WEBPRO White Paper / SEO Scientific";

const DEFAULT_DEK: &str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor.";

fn default_dek() -> String {
    DEFAULT_DEK.to_string()
}

fn default_eyebrow() -> Option<String> {
    Some(DEFAULT_EYEBROW.to_string())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DraftContent {
    pub meta: DraftMeta,
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub export_dir: String,
    pub mdx_path: String,
    pub image_count: usize,
}

fn dirs_fallback() -> PathBuf {
    std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| e.to_string())
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join(SETTINGS_FILE))
}

fn load_settings(app: &tauri::AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(app)?;
    if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).map_err(|e| e.to_string())
    } else {
        Ok(AppSettings::default())
    }
}

fn save_settings(app: &tauri::AppHandle, settings: &AppSettings) -> Result<(), String> {
    let dir = app_data_dir(app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let raw = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(settings_path(app)?, raw).map_err(|e| e.to_string())
}

fn ensure_drafts_dir(path: &Path) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

fn draft_dir(base: &Path, slug: &str) -> PathBuf {
    base.join(slug)
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

fn read_meta(path: &Path) -> Result<DraftMeta, String> {
    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

fn write_meta(path: &Path, meta: &DraftMeta) -> Result<(), String> {
    let raw = serde_json::to_string_pretty(meta).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())
}

fn strip_html_tags(input: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for ch in input.chars() {
        if ch == '<' {
            in_tag = true;
        } else if ch == '>' {
            in_tag = false;
        } else if !in_tag {
            if ch.is_whitespace() {
                if !out.ends_with(' ') && !out.is_empty() {
                    out.push(' ');
                }
            } else {
                out.push(ch);
            }
        }
    }
    out.trim().to_string()
}

fn slugify_ascii(input: &str) -> String {
    let lower = input.to_lowercase();
    let mut slug = String::new();
    let mut last_dash = false;
    for ch in lower.chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch);
            last_dash = false;
        } else if !last_dash {
            slug.push('-');
            last_dash = true;
        }
    }
    slug.trim_matches('-').to_string()
}

/// Slug from a hero title that may include `<span class="accent">` markup.
fn slugify(input: &str) -> String {
    slugify_ascii(&strip_html_tags(input))
}

#[tauri::command]
fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    load_settings(&app)
}

#[tauri::command]
fn set_drafts_dir(app: tauri::AppHandle, path: String) -> Result<AppSettings, String> {
    let mut settings = load_settings(&app)?;
    settings.drafts_dir = path.clone();
    ensure_drafts_dir(Path::new(&path))?;
    save_settings(&app, &settings)?;
    Ok(settings)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitHubSettingsUpdate {
    pub github_owner: String,
    pub github_repo: String,
    pub github_branch: String,
}

#[tauri::command]
fn set_github_settings(
    app: tauri::AppHandle,
    update: GitHubSettingsUpdate,
) -> Result<AppSettings, String> {
    let mut settings = load_settings(&app)?;
    settings.github_owner = update.github_owner.trim().to_string();
    settings.github_repo = update.github_repo.trim().to_string();
    settings.github_branch = update.github_branch.trim().to_string();
    if settings.github_owner.is_empty() || settings.github_repo.is_empty() || settings.github_branch.is_empty()
    {
        return Err("GitHub owner, repo, and branch are required".into());
    }
    save_settings(&app, &settings)?;
    Ok(settings)
}

#[tauri::command]
fn set_github_token(token: String) -> Result<(), String> {
    let trimmed = token.trim();
    if trimmed.is_empty() {
        return Err("GitHub token cannot be empty".into());
    }
    save_github_token(trimmed)
}

#[tauri::command]
fn disconnect_github(app: tauri::AppHandle) -> Result<AppSettings, String> {
    clear_github_token()?;
    let mut settings = load_settings(&app)?;
    settings.github_username = None;
    save_settings(&app, &settings)?;
    Ok(settings)
}

#[tauri::command]
fn get_github_token_configured() -> Result<bool, String> {
    has_github_token()
}

#[tauri::command]
fn test_github_connection(app: tauri::AppHandle) -> Result<GitHubConnectionStatus, String> {
    let settings = load_settings(&app)?;
    let token = load_github_token()?.ok_or("GitHub token is not configured")?;
    let status = github::test_connection(
        token,
        settings.github_owner.clone(),
        settings.github_repo.clone(),
    )?;

    if status.can_push {
        let mut next = settings;
        next.github_username = Some(status.login.clone());
        save_settings(&app, &next)?;
    }

    Ok(status)
}

fn list_asset_filenames(draft_path: &Path) -> Result<Vec<String>, String> {
    let assets_dir = draft_path.join("assets");
    if !assets_dir.exists() {
        return Ok(vec![]);
    }

    let mut filenames = Vec::new();
    for entry in fs::read_dir(&assets_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().map_err(|e| e.to_string())?.is_file() {
            filenames.push(entry.file_name().to_string_lossy().into_owned());
        }
    }
    filenames.sort();
    Ok(filenames)
}

fn format_mdx_script_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../scripts/format-mdx.mjs")
}

/// Prettier always ends MDX with a newline; `.trim()` alone would strip it and fail CI.
fn finalize_formatted_mdx(raw: &str) -> String {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    format!("{trimmed}\n")
}

#[tauri::command]
fn format_mdx(raw_mdx: String) -> Result<String, String> {
    let script = format_mdx_script_path();
    if !script.is_file() {
        return Err("Prettier format script not found".into());
    }

    let temp_dir = std::env::temp_dir();
    let input_path = temp_dir.join(format!(
        "webpro-mdx-format-{}.mdx",
        Utc::now().timestamp_nanos_opt().unwrap_or(0)
    ));
    fs::write(&input_path, &raw_mdx).map_err(|e| e.to_string())?;

    let output = Command::new("node")
        .arg(&script)
        .arg(&input_path)
        .output()
        .map_err(|e| {
            format!(
                "Failed to run Prettier via Node.js. Ensure Node.js 20+ is installed and on PATH. ({e})"
            )
        })?;

    let _ = fs::remove_file(&input_path);

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!(
            "Prettier formatting failed:\n{stderr}{stdout}"
        ));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
fn list_draft_assets(app: tauri::AppHandle, slug: String) -> Result<Vec<String>, String> {
    let settings = load_settings(&app)?;
    let draft_path = draft_dir(Path::new(&settings.drafts_dir), &slug);
    if !draft_path.exists() {
        return Err(format!("Draft '{}' not found", slug));
    }
    list_asset_filenames(&draft_path)
}

#[tauri::command]
fn list_drafts(app: tauri::AppHandle) -> Result<Vec<DraftSummary>, String> {
    let settings = load_settings(&app)?;
    let base = PathBuf::from(&settings.drafts_dir);
    if !base.exists() {
        return Ok(vec![]);
    }

    let mut summaries = Vec::new();
    for entry in fs::read_dir(&base).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if !entry.file_type().map_err(|e| e.to_string())?.is_dir() {
            continue;
        }
        let meta_path = entry.path().join("meta.json");
        if !meta_path.exists() {
            continue;
        }
        let meta = read_meta(&meta_path)?;
        summaries.push(DraftSummary {
            slug: meta.slug,
            title: meta.title,
            publish_date: meta.publish_date,
            draft: meta.draft,
            last_edited: meta.last_edited,
        });
    }

    summaries.sort_by(|a, b| {
        b.publish_date
            .cmp(&a.publish_date)
            .then_with(|| a.slug.cmp(&b.slug))
    });
    Ok(summaries)
}

#[tauri::command]
fn create_draft(app: tauri::AppHandle, title: String, slug: Option<String>) -> Result<DraftContent, String> {
    let settings = load_settings(&app)?;
    ensure_drafts_dir(Path::new(&settings.drafts_dir))?;

    let slug = slug
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| slugify(&title));
    if slug.is_empty() {
        return Err("Slug cannot be empty".into());
    }

    let dir = draft_dir(Path::new(&settings.drafts_dir), &slug);
    if dir.exists() {
        return Err(format!("Draft '{}' already exists", slug));
    }

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(dir.join("assets")).map_err(|e| e.to_string())?;

    let today = Utc::now().format("%Y-%m-%d").to_string();
    let meta = DraftMeta {
        slug: slug.clone(),
        title: title.clone(),
        dek: default_dek(),
        description: None,
        eyebrow: default_eyebrow(),
        byline: None,
        publish_date: today,
        updated_date: None,
        draft: false,
        author: default_byline_author(),
        company: default_company(),
        location: default_location(),
        category: None,
        tags: vec![],
        crescendo_heading: None,
        crescendo_body: vec![],
        last_edited: now_iso(),
    };

    write_meta(&dir.join("meta.json"), &meta)?;
    fs::write(dir.join("body.mdx"), "").map_err(|e| e.to_string())?;

    Ok(DraftContent { meta, body: String::new() })
}

#[tauri::command]
fn load_draft(app: tauri::AppHandle, slug: String) -> Result<DraftContent, String> {
    let settings = load_settings(&app)?;
    let dir = draft_dir(Path::new(&settings.drafts_dir), &slug);
    if !dir.exists() {
        return Err(format!("Draft '{}' not found", slug));
    }

    let meta = read_meta(&dir.join("meta.json"))?;
    let body = fs::read_to_string(dir.join("body.mdx")).unwrap_or_default();
    Ok(DraftContent { meta, body })
}

#[tauri::command]
fn save_draft(app: tauri::AppHandle, content: DraftContent) -> Result<DraftContent, String> {
    let settings = load_settings(&app)?;
    let dir = draft_dir(Path::new(&settings.drafts_dir), &content.meta.slug);
    if !dir.exists() {
        return Err(format!("Draft '{}' not found", content.meta.slug));
    }

    let mut meta = content.meta;
    meta.last_edited = now_iso();
    write_meta(&dir.join("meta.json"), &meta)?;
    fs::write(dir.join("body.mdx"), &content.body).map_err(|e| e.to_string())?;

    Ok(DraftContent { meta, body: content.body })
}

#[tauri::command]
fn delete_draft(app: tauri::AppHandle, slug: String) -> Result<(), String> {
    let settings = load_settings(&app)?;
    let dir = draft_dir(Path::new(&settings.drafts_dir), &slug);
    if dir.exists() {
        fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn zip_export_folder(export_root: &Path) -> Result<PathBuf, String> {
    let parent = export_root
        .parent()
        .ok_or_else(|| "Invalid export folder path".to_string())?;
    let zip_path = parent.join(format!(
        "{}.zip",
        export_root
            .file_name()
            .ok_or_else(|| "Invalid export folder name".to_string())?
            .to_string_lossy()
    ));

    let file = fs::File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut writer = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);

    for entry in WalkDir::new(export_root) {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            continue;
        }

        let rel = path
            .strip_prefix(parent)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .replace('\\', "/");

        writer.start_file(rel, options).map_err(|e| e.to_string())?;
        let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
        std::io::copy(&mut file, &mut writer).map_err(|e| e.to_string())?;
    }

    writer.finish().map_err(|e| e.to_string())?;
    Ok(zip_path)
}

#[tauri::command]
fn export_draft(
    app: tauri::AppHandle,
    slug: String,
    export_dir: String,
    formatted_mdx: String,
) -> Result<ExportResult, String> {
    let settings = load_settings(&app)?;
    let draft_path = draft_dir(Path::new(&settings.drafts_dir), &slug);
    if !draft_path.exists() {
        return Err(format!("Draft '{}' not found", slug));
    }

    let export_root = PathBuf::from(&export_dir).join(&slug);
    fs::create_dir_all(&export_root).map_err(|e| e.to_string())?;
    let images_dir = export_root.join("images");
    fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let assets_dir = draft_path.join("assets");
    let mut image_count = 0;

    if assets_dir.exists() {
        for entry in fs::read_dir(&assets_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            if !entry.file_type().map_err(|e| e.to_string())?.is_file() {
                continue;
            }
            let filename = entry.file_name().to_string_lossy().into_owned();
            let dest = images_dir.join(&filename);
            fs::copy(entry.path(), &dest).map_err(|e| e.to_string())?;
            image_count += 1;
        }
    }

    let mdx_path = export_root.join(format!("{}.mdx", slug));
    fs::write(&mdx_path, finalize_formatted_mdx(&formatted_mdx)).map_err(|e| e.to_string())?;

    let readme = format!(
        "WEBPRO SEO Insights — Export Bundle\n\
         ===================================\n\n\
         1. Copy `{}` to your webpro repo:\n\
            src/content/seo-insights/\n\n\
         2. Copy all files from `images/` to:\n\
            public/images/seo-insights/\n\n\
         3. Run `npm run dev` in webpro to preview.\n\
         4. Commit when ready.\n\n\
         Exported: {}\n",
        mdx_path.file_name().unwrap().to_string_lossy(),
        Utc::now().format("%Y-%m-%d %H:%M UTC")
    );
    fs::write(export_root.join("README.txt"), readme).map_err(|e| e.to_string())?;

    let zip_path = zip_export_folder(&export_root)?;
    fs::remove_dir_all(&export_root).map_err(|e| e.to_string())?;

    Ok(ExportResult {
        export_dir: zip_path.to_string_lossy().into_owned(),
        mdx_path: mdx_path.to_string_lossy().into_owned(),
        image_count,
    })
}

#[tauri::command]
fn publish_draft(
    app: tauri::AppHandle,
    slug: String,
    formatted_mdx: String,
    commit_message: String,
) -> Result<PublishResult, String> {
    let settings = load_settings(&app)?;
    let token = load_github_token()?.ok_or("GitHub token is not configured")?;

    let status = github::test_connection(
        token.clone(),
        settings.github_owner.clone(),
        settings.github_repo.clone(),
    )?;
    if !status.can_push {
        return Err(format!(
            "Your GitHub account (@{}) doesn't have write access to {}/{}. Ask the repo owner to invite you as a collaborator.",
            status.login, settings.github_owner, settings.github_repo
        ));
    }

    let draft_path = draft_dir(Path::new(&settings.drafts_dir), &slug);
    if !draft_path.exists() {
        return Err(format!("Draft '{}' not found", slug));
    }

    let mut files = vec![PublishFile {
        path: format!("src/content/seo-insights/{slug}.mdx"),
        content: finalize_formatted_mdx(&formatted_mdx).into_bytes(),
    }];

    let assets_dir = draft_path.join("assets");
    if assets_dir.exists() {
        for entry in fs::read_dir(&assets_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            if !entry.file_type().map_err(|e| e.to_string())?.is_file() {
                continue;
            }
            let filename = entry.file_name().to_string_lossy().into_owned();
            let bytes = fs::read(entry.path()).map_err(|e| e.to_string())?;
            files.push(PublishFile {
                path: format!("public/images/seo-insights/{filename}"),
                content: bytes,
            });
        }
    }

    github::publish_files(
        token,
        settings.github_owner,
        settings.github_repo,
        settings.github_branch,
        commit_message,
        status.login,
        files,
    )
}

#[tauri::command]
fn existing_draft_slugs(app: &tauri::AppHandle) -> Result<HashSet<String>, String> {
    Ok(list_drafts(app.clone())?
        .into_iter()
        .map(|d| d.slug)
        .collect())
}

#[tauri::command]
fn set_webpro_local_path(app: tauri::AppHandle, path: String) -> Result<AppSettings, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Webpro folder path cannot be empty".into());
    }
    resolve_webpro_paths(Path::new(trimmed))?;
    let mut settings = load_settings(&app)?;
    settings.webpro_local_path = Some(trimmed.to_string());
    save_settings(&app, &settings)?;
    Ok(settings)
}

#[tauri::command]
fn list_webpro_articles(app: tauri::AppHandle) -> Result<Vec<WebproArticleSummary>, String> {
    let settings = load_settings(&app)?;
    let token = load_github_token()?.ok_or("GitHub token is not configured")?;
    let existing = existing_draft_slugs(&app)?;
    let owner = settings.github_owner.clone();
    let repo = settings.github_repo.clone();
    let branch = settings.github_branch.clone();

    let files = list_seo_insights_mdx_files(token.clone(), owner.clone(), repo.clone(), branch.clone())?;

    let mut summaries = Vec::new();
    for (slug, _path) in files {
        let raw = fetch_seo_insights_mdx(token.clone(), owner.clone(), repo.clone(), branch.clone(), &slug)?;
        summaries.push(summary_from_mdx(
            slug.clone(),
            &raw,
            existing.contains(&slug),
        )?);
    }

    Ok(summaries)
}

#[tauri::command]
fn list_webpro_articles_local(
    app: tauri::AppHandle,
    webpro_root: String,
) -> Result<Vec<WebproArticleSummary>, String> {
    let existing = existing_draft_slugs(&app)?;
    list_local_webpro_articles(Path::new(webpro_root.trim()), &existing)
}

#[tauri::command]
fn import_webpro_articles_from_github(
    app: tauri::AppHandle,
    slugs: Vec<String>,
) -> Result<ImportWebproResult, String> {
    let settings = load_settings(&app)?;
    ensure_drafts_dir(Path::new(&settings.drafts_dir))?;
    let token = load_github_token()?.ok_or("GitHub token is not configured")?;
    let drafts_dir = PathBuf::from(&settings.drafts_dir);
    let owner = settings.github_owner.clone();
    let repo = settings.github_repo.clone();
    let branch = settings.github_branch.clone();

    let mut result = ImportWebproResult {
        imported: Vec::new(),
        skipped: Vec::new(),
        failed: Vec::new(),
    };

    for slug in slugs {
        if drafts_dir.join(&slug).exists() {
            result.skipped.push(slug);
            continue;
        }

        let raw = match fetch_seo_insights_mdx(
            token.clone(),
            owner.clone(),
            repo.clone(),
            branch.clone(),
            &slug,
        ) {
            Ok(raw) => raw,
            Err(err) => {
                result.failed.push(import_webpro::ImportWebproFailure { slug, error: err });
                continue;
            }
        };

        let image_filenames =
            import_webpro::discover_webpro_image_filenames(&parse_frontmatter(&raw)?.1);
        let mut image_files = Vec::new();
        for filename in &image_filenames {
            match fetch_seo_insights_image(
                token.clone(),
                owner.clone(),
                repo.clone(),
                branch.clone(),
                filename,
            ) {
                Ok(bytes) => image_files.push((filename.clone(), bytes)),
                Err(_) => {}
            }
        }

        let image_source = ImageSource::Memory(MemoryImageSource { files: image_files });
        match create_draft_from_webpro_mdx(&drafts_dir, &slug, &raw, &image_source, true) {
            Ok(_) => result.imported.push(slug),
            Err(err) if err.contains("already exists") => result.skipped.push(slug),
            Err(err) => result.failed.push(import_webpro::ImportWebproFailure { slug, error: err }),
        }
    }

    Ok(result)
}

#[tauri::command]
fn import_webpro_articles_local(
    app: tauri::AppHandle,
    webpro_root: String,
    slugs: Vec<String>,
) -> Result<ImportWebproResult, String> {
    let settings = load_settings(&app)?;
    ensure_drafts_dir(Path::new(&settings.drafts_dir))?;
    let paths = resolve_webpro_paths(Path::new(webpro_root.trim()))?;
    let drafts_dir = PathBuf::from(&settings.drafts_dir);
    let image_source = ImageSource::Local(LocalImageSource {
        images_dir: &paths.images_dir,
    });

    Ok(import_webpro_slugs(&drafts_dir, &slugs, |slug| {
        let mdx_path = paths.content_dir.join(format!("{slug}.mdx"));
        if mdx_path.is_file() {
            return fs::read_to_string(&mdx_path).map_err(|e| e.to_string());
        }
        let md_path = paths.content_dir.join(format!("{slug}.md"));
        fs::read_to_string(&md_path).map_err(|e| e.to_string())
    }, &image_source))
}

#[tauri::command]
fn import_mdx(app: tauri::AppHandle, file_path: String) -> Result<DraftContent, String> {
    let settings = load_settings(&app)?;
    ensure_drafts_dir(Path::new(&settings.drafts_dir))?;

    let raw = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let meta_preview = parse_frontmatter(&raw)?.0;

    let slug = Path::new(&file_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| slugify(&meta_preview.title));

    let empty_images = ImageSource::Memory(MemoryImageSource { files: vec![] });
    create_draft_from_webpro_mdx(
        Path::new(&settings.drafts_dir),
        &slug,
        &raw,
        &empty_images,
        true,
    )
    .map_err(|e| {
        if e.contains("already exists") {
            format!("Draft '{slug}' already exists — delete it first or rename the file")
        } else {
            e
        }
    })
}

pub(crate) fn parse_frontmatter(raw: &str) -> Result<(DraftMeta, String), String> {
    let trimmed = raw.trim_start();
    if !trimmed.starts_with("---") {
        return Err("File has no YAML frontmatter".into());
    }

    let rest = &trimmed[3..];
    let end = rest.find("\n---").ok_or("Frontmatter closing --- not found")?;
    let yaml = &rest[..end];
    let body = rest[end + 4..].trim_start_matches('\n').to_string();

    let mut meta = DraftMeta {
        slug: String::new(),
        title: String::new(),
        dek: String::new(),
        description: None,
        eyebrow: None,
        byline: None,
        publish_date: Utc::now().format("%Y-%m-%d").to_string(),
        updated_date: None,
        draft: false,
        author: default_byline_author(),
        company: default_company(),
        location: default_location(),
        category: None,
        tags: vec![],
        crescendo_heading: None,
        crescendo_body: vec![],
        last_edited: now_iso(),
    };

    let mut in_crescendo = false;
    for line in yaml.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if in_crescendo {
            if let Some(para) = line.strip_prefix("- ") {
                meta.crescendo_body.push(parse_yaml_scalar(para));
                continue;
            }
            in_crescendo = false;
        }
        if let Some((key, val)) = line.split_once(':') {
            let key = key.trim();
            let val = val.trim();
            match key {
                "title" => meta.title = parse_yaml_scalar(val),
                "dek" => meta.dek = parse_yaml_scalar(val),
                "description" => meta.description = Some(parse_yaml_scalar(val)),
                "eyebrow" => meta.eyebrow = Some(parse_yaml_scalar(val)),
                "byline" => meta.byline = Some(parse_yaml_scalar(val)),
                "publishDate" => meta.publish_date = parse_yaml_scalar(val),
                "updatedDate" => meta.updated_date = Some(parse_yaml_scalar(val)),
                "draft" => meta.draft = val == "true",
                "author" => meta.company = parse_yaml_scalar(val),
                "company" => meta.company = parse_yaml_scalar(val),
                "location" => meta.location = parse_yaml_scalar(val),
                "category" => meta.category = Some(parse_yaml_scalar(val)),
                "tags" => {
                    let inner = val.trim_start_matches('[').trim_end_matches(']');
                    meta.tags = inner
                        .split(',')
                        .map(|t| parse_yaml_scalar(t.trim()))
                        .filter(|t| !t.is_empty())
                        .collect();
                }
                "crescendoHeading" => meta.crescendo_heading = Some(parse_yaml_scalar(val)),
                "crescendoBody" => {
                    in_crescendo = true;
                    if let Some(para) = val.strip_prefix("- ") {
                        meta.crescendo_body.push(parse_yaml_scalar(para));
                    }
                }
                _ => {}
            }
        }
    }

    if meta.title.is_empty() {
        return Err("Frontmatter must include title".into());
    }

    Ok((meta, body))
}

fn parse_yaml_scalar(s: &str) -> String {
    let s = s.trim();
    if s.starts_with('"') {
        if let Ok(parsed) = serde_json::from_str::<String>(s) {
            return parsed;
        }
    }
    if (s.starts_with('"') && s.ends_with('"')) || (s.starts_with('\'') && s.ends_with('\'')) {
        return s[1..s.len() - 1]
            .replace("\\\"", "\"")
            .replace("\\n", "\n");
    }
    s.to_string()
}

#[cfg(test)]
mod formatted_mdx_tests {
    use super::finalize_formatted_mdx;

    #[test]
    fn finalize_preserves_prettier_trailing_newline() {
        assert_eq!(finalize_formatted_mdx("---\ntitle: T\n---\n\nBody\n"), "---\ntitle: T\n---\n\nBody\n");
    }

    #[test]
    fn finalize_adds_newline_when_trimmed_away() {
        assert_eq!(finalize_formatted_mdx("---\ntitle: T\n---\n\nBody"), "---\ntitle: T\n---\n\nBody\n");
    }
}

#[cfg(test)]
mod frontmatter_tests {
    use super::parse_frontmatter;

    #[test]
    fn parse_title_with_accent_span_unquoted() {
        let raw = "---\ntitle: Wolf. <span class=\"accent\">Wolf.</span> Wolf.\ndek: Subtitle\npublishDate: 2025-01-01\n---\n\nBody";
        let (meta, body) = parse_frontmatter(raw).expect("parse");
        assert_eq!(meta.title, "Wolf. <span class=\"accent\">Wolf.</span> Wolf.");
        assert_eq!(body.trim(), "Body");
    }

    #[test]
    fn parse_title_with_accent_span_json_quoted() {
        let raw = "---\ntitle: \"Wolf. <span class=\\\"accent\\\">Wolf.</span> Wolf.\"\ndek: Subtitle\npublishDate: 2025-01-01\n---\n\nBody";
        let (meta, _) = parse_frontmatter(raw).expect("parse");
        assert_eq!(meta.title, "Wolf. <span class=\"accent\">Wolf.</span> Wolf.");
    }

    #[test]
    fn slugify_strips_accent_markup() {
        assert_eq!(
            super::slugify("Wolf. <span class=\"accent\">Wolf.</span> Wolf."),
            "wolf-wolf-wolf"
        );
    }
}

fn guess_image_mime(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase()
        .as_str()
    {
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        _ => "image/png",
    }
}

#[tauri::command]
fn read_draft_asset_data_url(app: tauri::AppHandle, slug: String, rel_path: String) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};

    let settings = load_settings(&app)?;
    let rel = rel_path.strip_prefix("./").unwrap_or(&rel_path);
    let asset_path = draft_dir(Path::new(&settings.drafts_dir), &slug).join(rel);
    if !asset_path.is_file() {
        return Err(format!("Asset not found: {}", rel_path));
    }

    let bytes = fs::read(&asset_path).map_err(|e| e.to_string())?;
    let mime = guess_image_mime(&asset_path);
    Ok(format!("data:{};base64,{}", mime, STANDARD.encode(bytes)))
}

#[tauri::command]
fn copy_image_to_draft(app: tauri::AppHandle, slug: String, source_path: String) -> Result<String, String> {
    let settings = load_settings(&app)?;
    let assets_dir = draft_dir(Path::new(&settings.drafts_dir), &slug).join("assets");
    fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;

    let filename = Path::new(&source_path)
        .file_name()
        .ok_or("Invalid source path")?
        .to_string_lossy()
        .into_owned();

    let dest = assets_dir.join(&filename);
    fs::copy(&source_path, &dest).map_err(|e| e.to_string())?;

    Ok(format!("assets/{}", filename))
}

fn apply_window_icon(app: &tauri::App) {
    let icon_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("icons/32x32.png");
    let icon = if icon_path.is_file() {
        tauri::image::Image::from_path(&icon_path).ok()
    } else {
        None
    }
    .or_else(|| tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png")).ok());

    let Some(icon) = icon else {
        return;
    };

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_icon(icon);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            apply_window_icon(app);
            if let Some(window) = app.get_webview_window("main") {
                let version = app.package_info().version.to_string();
                let title = format!("Webpro MDX Editor v{version}");
                let _ = window.set_title(&title);
            }
            let settings = load_settings(&app.handle()).unwrap_or_default();
            ensure_drafts_dir(Path::new(&settings.drafts_dir)).ok();
            save_settings(&app.handle(), &settings).ok();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            set_drafts_dir,
            set_github_settings,
            set_github_token,
            disconnect_github,
            get_github_token_configured,
            test_github_connection,
            format_mdx,
            list_draft_assets,
            list_drafts,
            create_draft,
            load_draft,
            save_draft,
            delete_draft,
            export_draft,
            publish_draft,
            import_mdx,
            set_webpro_local_path,
            list_webpro_articles,
            list_webpro_articles_local,
            import_webpro_articles_from_github,
            import_webpro_articles_local,
            copy_image_to_draft,
            read_draft_asset_data_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
