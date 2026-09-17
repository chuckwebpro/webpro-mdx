use crate::{parse_frontmatter, DraftContent};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

pub const SEO_INSIGHTS_CONTENT: &str = "src/content/seo-insights";
pub const SEO_INSIGHTS_IMAGES: &str = "public/images/seo-insights";
const WEBPRO_IMAGE_PREFIX: &str = "/images/seo-insights/";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebproArticleSummary {
    pub slug: String,
    pub title: String,
    pub publish_date: Option<String>,
    pub already_imported: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportWebproFailure {
    pub slug: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportWebproResult {
    pub imported: Vec<String>,
    pub skipped: Vec<String>,
    pub failed: Vec<ImportWebproFailure>,
}

#[derive(Debug, Clone)]
pub struct WebproPaths {
    pub content_dir: PathBuf,
    pub images_dir: PathBuf,
}

pub struct LocalImageSource<'a> {
    pub images_dir: &'a Path,
}

pub struct MemoryImageSource {
    pub files: Vec<(String, Vec<u8>)>,
}

pub enum ImageSource<'a> {
    Local(LocalImageSource<'a>),
    Memory(MemoryImageSource),
}

pub fn resolve_webpro_paths(input: &Path) -> Result<WebproPaths, String> {
    let input = input.canonicalize().map_err(|e| e.to_string())?;
    let file_name = input
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("");

    if file_name == "seo-insights" {
        let repo_root = input
            .ancestors()
            .nth(3)
            .ok_or_else(|| "Could not infer webpro repo root from seo-insights folder".to_string())?
            .to_path_buf();
        return Ok(WebproPaths {
            content_dir: input.clone(),
            images_dir: repo_root.join(SEO_INSIGHTS_IMAGES),
        });
    }

    let content_dir = input.join(SEO_INSIGHTS_CONTENT);
    if content_dir.is_dir() {
        return Ok(WebproPaths {
            content_dir,
            images_dir: input.join(SEO_INSIGHTS_IMAGES),
        });
    }

    Err(format!(
        "Not a webpro repo. Pick the webpro root folder (containing {SEO_INSIGHTS_CONTENT}) or the seo-insights folder directly."
    ))
}

pub fn discover_webpro_image_filenames(body: &str) -> Vec<String> {
    let mut found = HashSet::new();
    let mut start = 0;
    while let Some(idx) = body[start..].find(WEBPRO_IMAGE_PREFIX) {
        let abs_idx = start + idx + WEBPRO_IMAGE_PREFIX.len();
        let rest = &body[abs_idx..];
        let end = rest
            .find(|c: char| c.is_whitespace() || c == '"' || c == '\'' || c == ')' || c == '>' || c == '`')
            .unwrap_or(rest.len());
        let filename = rest[..end].trim();
        if !filename.is_empty() && !filename.contains('/') {
            found.insert(filename.to_string());
        }
        start = abs_idx + end.max(1);
    }
    let mut filenames: Vec<_> = found.into_iter().collect();
    filenames.sort();
    filenames
}

pub fn rewrite_webpro_image_paths_for_draft(body: &str) -> (String, Vec<String>) {
    let filenames = discover_webpro_image_filenames(body);
    let mut rewritten = body.to_string();
    for filename in &filenames {
        let from = format!("{WEBPRO_IMAGE_PREFIX}{filename}");
        let to = format!("assets/{filename}");
        rewritten = rewritten.replace(&from, &to);
    }
    (rewritten, filenames)
}

pub fn summary_from_mdx(slug: String, raw: &str, already_imported: bool) -> Result<WebproArticleSummary, String> {
    let (meta, _) = parse_frontmatter(raw)?;
    Ok(WebproArticleSummary {
        title: meta.title,
        publish_date: Some(meta.publish_date).filter(|d| !d.is_empty()),
        slug,
        already_imported,
    })
}

pub fn list_local_webpro_articles(
    webpro_root: &Path,
    existing_slugs: &HashSet<String>,
) -> Result<Vec<WebproArticleSummary>, String> {
    let paths = resolve_webpro_paths(webpro_root)?;
    let mut summaries = Vec::new();

    for entry in fs::read_dir(&paths.content_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if ext != "mdx" && ext != "md" {
            continue;
        }
        let slug = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
        if slug.is_empty() {
            continue;
        }
        let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        summaries.push(summary_from_mdx(
            slug.clone(),
            &raw,
            existing_slugs.contains(&slug),
        )?);
    }

    summaries.sort_by(|a, b| {
        b.publish_date
            .as_deref()
            .unwrap_or("")
            .cmp(a.publish_date.as_deref().unwrap_or(""))
            .then_with(|| a.slug.cmp(&b.slug))
    });
    Ok(summaries)
}

pub fn create_draft_from_webpro_mdx(
    drafts_dir: &Path,
    slug: &str,
    raw_mdx: &str,
    image_source: &ImageSource<'_>,
    skip_if_exists: bool,
) -> Result<DraftContent, String> {
    let dir = drafts_dir.join(slug);
    if dir.exists() {
        if skip_if_exists {
            return Err(format!("Draft '{slug}' already exists"));
        }
        return Err(format!("Draft '{slug}' already exists"));
    }

    let (mut meta, body) = parse_frontmatter(raw_mdx)?;
    let (body, image_filenames) = rewrite_webpro_image_paths_for_draft(&body);

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let assets_dir = dir.join("assets");
    fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;

    for filename in &image_filenames {
        let dest = assets_dir.join(filename);
        match image_source {
            ImageSource::Local(source) => {
                let src = source.images_dir.join(filename);
                if src.is_file() {
                    fs::copy(&src, &dest).map_err(|e| e.to_string())?;
                }
            }
            ImageSource::Memory(source) => {
                if let Some((_, bytes)) = source.files.iter().find(|(name, _)| name == filename) {
                    fs::write(&dest, bytes).map_err(|e| e.to_string())?;
                }
            }
        }
    }

    meta.slug = slug.to_string();
    meta.last_edited = chrono::Utc::now().to_rfc3339();

    let meta_path = dir.join("meta.json");
    let raw_meta = serde_json::to_string_pretty(&meta).map_err(|e| e.to_string())?;
    fs::write(&meta_path, raw_meta).map_err(|e| e.to_string())?;
    fs::write(dir.join("body.mdx"), body.trim()).map_err(|e| e.to_string())?;

    Ok(DraftContent {
        meta,
        body: body.trim().to_string(),
    })
}

pub fn import_webpro_slugs(
    drafts_dir: &Path,
    slugs: &[String],
    fetch_mdx: impl Fn(&str) -> Result<String, String>,
    image_source: &ImageSource<'_>,
) -> ImportWebproResult {
    let mut result = ImportWebproResult {
        imported: Vec::new(),
        skipped: Vec::new(),
        failed: Vec::new(),
    };

    for slug in slugs {
        if drafts_dir.join(slug).exists() {
            result.skipped.push(slug.clone());
            continue;
        }

        match fetch_mdx(slug) {
            Ok(raw) => match create_draft_from_webpro_mdx(drafts_dir, slug, &raw, image_source, true) {
                Ok(_) => result.imported.push(slug.clone()),
                Err(err) if err.contains("already exists") => result.skipped.push(slug.clone()),
                Err(err) => result.failed.push(ImportWebproFailure {
                    slug: slug.clone(),
                    error: err,
                }),
            },
            Err(err) => result.failed.push(ImportWebproFailure {
                slug: slug.clone(),
                error: err,
            }),
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn discovers_and_rewrites_webpro_image_paths() {
        let body = r#"<Shot src="/images/seo-insights/chart.png" alt="Chart" />"#;
        let (rewritten, files) = rewrite_webpro_image_paths_for_draft(body);
        assert_eq!(files, vec!["chart.png".to_string()]);
        assert!(rewritten.contains(r#"src="assets/chart.png""#));
    }
}
