use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

const SETTINGS_FILE: &str = "settings.json";
const DEFAULT_DRAFTS_FOLDER: &str = "WebproArticles";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub drafts_dir: String,
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
    #[serde(default = "default_author")]
    pub author: String,
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

fn default_author() -> String {
    "WEBPRO International Inc.".to_string()
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

fn slugify(input: &str) -> String {
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

#[tauri::command]
fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    load_settings(&app)
}

#[tauri::command]
fn set_drafts_dir(app: tauri::AppHandle, path: String) -> Result<AppSettings, String> {
    let settings = AppSettings { drafts_dir: path.clone() };
    ensure_drafts_dir(Path::new(&path))?;
    save_settings(&app, &settings)?;
    Ok(settings)
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

    summaries.sort_by(|a, b| b.last_edited.cmp(&a.last_edited));
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
        dek: String::new(),
        description: None,
        eyebrow: None,
        byline: None,
        publish_date: today,
        updated_date: None,
        draft: true,
        author: default_author(),
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

fn yaml_escape(s: &str) -> String {
    if s.contains('\n') || s.contains('"') || s.contains('\'') || s.contains(':') {
        let escaped = s.replace('\\', "\\\\").replace('"', "\\\"");
        format!("\"{}\"", escaped)
    } else {
        s.to_string()
    }
}

fn build_frontmatter(meta: &DraftMeta) -> String {
    let mut lines = vec![
        "---".to_string(),
        format!("title: {}", yaml_escape(&meta.title)),
        format!("dek: {}", yaml_escape(&meta.dek)),
        format!("publishDate: {}", meta.publish_date),
    ];

    if let Some(v) = &meta.description {
        lines.push(format!("description: {}", yaml_escape(v)));
    }
    if let Some(v) = &meta.eyebrow {
        lines.push(format!("eyebrow: {}", yaml_escape(v)));
    }
    if let Some(v) = &meta.byline {
        lines.push(format!("byline: {}", yaml_escape(v)));
    }
    if let Some(v) = &meta.updated_date {
        lines.push(format!("updatedDate: {}", v));
    }
    if meta.draft {
        lines.push("draft: true".to_string());
    }
    lines.push(format!("author: {}", yaml_escape(&meta.author)));
    if let Some(v) = &meta.category {
        lines.push(format!("category: {}", yaml_escape(v)));
    }
    if !meta.tags.is_empty() {
        let tags = meta
            .tags
            .iter()
            .map(|t| yaml_escape(t))
            .collect::<Vec<_>>()
            .join(", ");
        lines.push(format!("tags: [{}]", tags));
    }
    if let Some(v) = &meta.crescendo_heading {
        lines.push(format!("crescendoHeading: {}", yaml_escape(v)));
    }
    if !meta.crescendo_body.is_empty() {
        lines.push("crescendoBody:".to_string());
        for para in &meta.crescendo_body {
            lines.push(format!("  - {}", yaml_escape(para)));
        }
    }

    lines.push("---".to_string());
    lines.join("\n")
}

#[tauri::command]
fn export_draft(app: tauri::AppHandle, slug: String, export_dir: String) -> Result<ExportResult, String> {
    let settings = load_settings(&app)?;
    let draft_path = draft_dir(Path::new(&settings.drafts_dir), &slug);
    if !draft_path.exists() {
        return Err(format!("Draft '{}' not found", slug));
    }

    let meta = read_meta(&draft_path.join("meta.json"))?;
    let body = fs::read_to_string(draft_path.join("body.mdx")).unwrap_or_default();

    let export_root = PathBuf::from(&export_dir).join(&slug);
    fs::create_dir_all(&export_root).map_err(|e| e.to_string())?;
    let images_dir = export_root.join("images");
    fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let mut exported_body = body.clone();
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

            let public_path = format!("/images/seo-insights/{}", filename);
            exported_body = exported_body.replace(&format!("assets/{}", filename), &public_path);
            exported_body = exported_body.replace(&format!("./assets/{}", filename), &public_path);
            image_count += 1;
        }
    }

    let mdx_content = format!("{}\n\n{}", build_frontmatter(&meta), exported_body.trim());
    let mdx_path = export_root.join(format!("{}.mdx", slug));
    fs::write(&mdx_path, &mdx_content).map_err(|e| e.to_string())?;

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

    Ok(ExportResult {
        export_dir: export_root.to_string_lossy().into_owned(),
        mdx_path: mdx_path.to_string_lossy().into_owned(),
        image_count,
    })
}

#[tauri::command]
fn import_mdx(app: tauri::AppHandle, file_path: String) -> Result<DraftContent, String> {
    let settings = load_settings(&app)?;
    ensure_drafts_dir(Path::new(&settings.drafts_dir))?;

    let raw = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let (frontmatter, body) = parse_frontmatter(&raw)?;

    let slug = Path::new(&file_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| slugify(&frontmatter.title));

    let dir = draft_dir(Path::new(&settings.drafts_dir), &slug);
    if dir.exists() {
        return Err(format!("Draft '{}' already exists — delete it first or rename the file", slug));
    }

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(dir.join("assets")).map_err(|e| e.to_string())?;

    let mut meta = frontmatter;
    meta.slug = slug.clone();
    meta.last_edited = now_iso();

    write_meta(&dir.join("meta.json"), &meta)?;
    fs::write(dir.join("body.mdx"), body.trim()).map_err(|e| e.to_string())?;

    Ok(DraftContent {
        meta,
        body: body.trim().to_string(),
    })
}

fn parse_frontmatter(raw: &str) -> Result<(DraftMeta, String), String> {
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
        author: default_author(),
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
                meta.crescendo_body.push(unquote_yaml(para));
                continue;
            }
            in_crescendo = false;
        }
        if let Some((key, val)) = line.split_once(':') {
            let key = key.trim();
            let val = val.trim();
            match key {
                "title" => meta.title = unquote_yaml(val),
                "dek" => meta.dek = unquote_yaml(val),
                "description" => meta.description = Some(unquote_yaml(val)),
                "eyebrow" => meta.eyebrow = Some(unquote_yaml(val)),
                "byline" => meta.byline = Some(unquote_yaml(val)),
                "publishDate" => meta.publish_date = unquote_yaml(val),
                "updatedDate" => meta.updated_date = Some(unquote_yaml(val)),
                "draft" => meta.draft = val == "true",
                "author" => meta.author = unquote_yaml(val),
                "category" => meta.category = Some(unquote_yaml(val)),
                "tags" => {
                    let inner = val.trim_start_matches('[').trim_end_matches(']');
                    meta.tags = inner
                        .split(',')
                        .map(|t| unquote_yaml(t.trim()))
                        .filter(|t| !t.is_empty())
                        .collect();
                }
                "crescendoHeading" => meta.crescendo_heading = Some(unquote_yaml(val)),
                "crescendoBody" => {
                    in_crescendo = true;
                    if let Some(para) = val.strip_prefix("- ") {
                        meta.crescendo_body.push(unquote_yaml(para));
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

fn unquote_yaml(s: &str) -> String {
    let s = s.trim();
    if (s.starts_with('"') && s.ends_with('"')) || (s.starts_with('\'') && s.ends_with('\'')) {
        s[1..s.len() - 1].replace("\\\"", "\"").replace("\\n", "\n")
    } else {
        s.to_string()
    }
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let settings = load_settings(&app.handle()).unwrap_or_default();
            ensure_drafts_dir(Path::new(&settings.drafts_dir)).ok();
            save_settings(&app.handle(), &settings).ok();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            set_drafts_dir,
            list_drafts,
            create_draft,
            load_draft,
            save_draft,
            delete_draft,
            export_draft,
            import_mdx,
            copy_image_to_draft,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
