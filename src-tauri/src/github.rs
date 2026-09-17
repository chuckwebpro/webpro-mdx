use base64::{engine::general_purpose::STANDARD, Engine as _};
use reqwest::header::AUTHORIZATION;
use serde::{Deserialize, Serialize};

const API_BASE: &str = "https://api.github.com";
const USER_AGENT_VALUE: &str = "webpro-mdx-editor";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubConnectionStatus {
    pub login: String,
    pub can_push: bool,
    pub repo_full_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishResult {
    pub commit_sha: String,
    pub commit_url: String,
    pub files_published: Vec<String>,
    pub author_login: String,
}

pub struct PublishFile {
    pub path: String,
    pub content: Vec<u8>,
}

struct GitHubClient {
    http: reqwest::blocking::Client,
    token: String,
}

impl GitHubClient {
    fn new(token: String) -> Result<Self, String> {
        let http = reqwest::blocking::Client::builder()
            .user_agent(USER_AGENT_VALUE)
            .build()
            .map_err(|e| e.to_string())?;
        Ok(Self { http, token })
    }

    fn authed(&self, request: reqwest::blocking::RequestBuilder) -> reqwest::blocking::RequestBuilder {
        request.header(AUTHORIZATION, format!("Bearer {}", self.token))
    }

    fn api_error(response: reqwest::blocking::Response) -> String {
        let status = response.status();
        let body = response.text().unwrap_or_default();
        if status.as_u16() == 401 {
            return "GitHub token is invalid or expired".to_string();
        }
        if status.as_u16() == 403 {
            return format!(
                "GitHub denied access (403). Ensure you are invited as a collaborator with write access. {body}"
            );
        }
        if status.as_u16() == 422 {
            return "Branch was updated on GitHub — retry publish".to_string();
        }
        format!("GitHub API error ({status}): {body}")
    }

    fn request_error(context: &str, err: reqwest::Error) -> String {
        if err.is_connect() {
            return format!(
                "{context}: could not reach GitHub ({err}). Check your internet connection, VPN, or firewall."
            );
        }
        if err.is_timeout() {
            return format!("{context}: GitHub request timed out ({err}).");
        }
        format!("{context}: {err}")
    }

    fn get_json<T: for<'de> Deserialize<'de>>(&self, path: &str) -> Result<T, String> {
        let url = format!("{API_BASE}{path}");
        let response = self
            .authed(self.http.get(&url))
            .send()
            .map_err(|e| Self::request_error("GitHub request failed", e))?;
        if !response.status().is_success() {
            return Err(Self::api_error(response));
        }
        response.json::<T>().map_err(|e| e.to_string())
    }

    fn post_json<T: Serialize, R: for<'de> Deserialize<'de>>(
        &self,
        path: &str,
        body: &T,
    ) -> Result<R, String> {
        let url = format!("{API_BASE}{path}");
        let response = self
            .authed(self.http.post(&url).json(body))
            .send()
            .map_err(|e| Self::request_error("GitHub request failed", e))?;
        if !response.status().is_success() {
            return Err(Self::api_error(response));
        }
        response.json::<R>().map_err(|e| e.to_string())
    }

    fn patch_json<T: Serialize, R: for<'de> Deserialize<'de>>(
        &self,
        path: &str,
        body: &T,
    ) -> Result<R, String> {
        let url = format!("{API_BASE}{path}");
        let response = self
            .authed(self.http.patch(&url).json(body))
            .send()
            .map_err(|e| Self::request_error("GitHub request failed", e))?;
        if !response.status().is_success() {
            return Err(Self::api_error(response));
        }
        response.json::<R>().map_err(|e| e.to_string())
    }

    fn list_directory(
        &self,
        owner: &str,
        repo: &str,
        path: &str,
        branch: &str,
    ) -> Result<Vec<ContentEntry>, String> {
        let encoded = path.replace(' ', "%20");
        let query = format!("/repos/{owner}/{repo}/contents/{encoded}?ref={branch}");
        self.get_json(&query)
    }

    fn fetch_file_bytes(
        &self,
        owner: &str,
        repo: &str,
        path: &str,
        branch: &str,
    ) -> Result<Vec<u8>, String> {
        let encoded = path.replace(' ', "%20");
        let query = format!("/repos/{owner}/{repo}/contents/{encoded}?ref={branch}");
        let entry: ContentEntry = self.get_json(&query)?;
        if entry.entry_type != "file" {
            return Err(format!("Expected file at {path}, found {}", entry.entry_type));
        }
        decode_content_entry(&entry)
    }

    fn fetch_file_text(
        &self,
        owner: &str,
        repo: &str,
        path: &str,
        branch: &str,
    ) -> Result<String, String> {
        let bytes = self.fetch_file_bytes(owner, repo, path, branch)?;
        String::from_utf8(bytes).map_err(|e| format!("File at {path} is not valid UTF-8: {e}"))
    }
}

#[derive(Debug, Deserialize)]
struct ContentEntry {
    name: String,
    path: String,
    #[serde(rename = "type")]
    entry_type: String,
    content: Option<String>,
    encoding: Option<String>,
}

fn decode_content_entry(entry: &ContentEntry) -> Result<Vec<u8>, String> {
    let content = entry
        .content
        .as_ref()
        .ok_or_else(|| format!("GitHub did not return content for {}", entry.path))?;
    let normalized = content.replace('\n', "");
    if entry.encoding.as_deref() == Some("base64") {
        STANDARD
            .decode(normalized.as_bytes())
            .map_err(|e| format!("Failed to decode {}: {e}", entry.path))
    } else {
        Ok(normalized.into_bytes())
    }
}

pub fn list_seo_insights_mdx_files(
    token: String,
    owner: String,
    repo: String,
    branch: String,
) -> Result<Vec<(String, String)>, String> {
    let client = GitHubClient::new(token)?;
    let entries = client.list_directory(
        &owner,
        &repo,
        crate::import_webpro::SEO_INSIGHTS_CONTENT,
        &branch,
    )?;

    let mut files = Vec::new();
    for entry in entries {
        if entry.entry_type != "file" {
            continue;
        }
        let ext = entry
            .name
            .rsplit('.')
            .next()
            .unwrap_or("")
            .to_lowercase();
        if ext != "mdx" && ext != "md" {
            continue;
        }
        let slug = entry
            .name
            .strip_suffix(&format!(".{ext}"))
            .unwrap_or(&entry.name)
            .to_string();
        if slug.is_empty() {
            continue;
        }
        files.push((slug, entry.path));
    }
    files.sort_by(|a, b| a.0.cmp(&b.0));
    Ok(files)
}

pub fn fetch_seo_insights_mdx(
    token: String,
    owner: String,
    repo: String,
    branch: String,
    slug: &str,
) -> Result<String, String> {
    let client = GitHubClient::new(token)?;
    let path = format!("{}/{}.mdx", crate::import_webpro::SEO_INSIGHTS_CONTENT, slug);
    if let Ok(text) = client.fetch_file_text(&owner, &repo, &path, &branch) {
        return Ok(text);
    }
    let path_md = format!("{}/{}.md", crate::import_webpro::SEO_INSIGHTS_CONTENT, slug);
    client.fetch_file_text(&owner, &repo, &path_md, &branch)
}

pub fn fetch_seo_insights_image(
    token: String,
    owner: String,
    repo: String,
    branch: String,
    filename: &str,
) -> Result<Vec<u8>, String> {
    let client = GitHubClient::new(token)?;
    let path = format!("{}/{}", crate::import_webpro::SEO_INSIGHTS_IMAGES, filename);
    client.fetch_file_bytes(&owner, &repo, &path, &branch)
}

pub fn test_connection(token: String, owner: String, repo: String) -> Result<GitHubConnectionStatus, String> {
        let client = GitHubClient::new(token)?;

        #[derive(Deserialize)]
        struct User {
            login: String,
        }

        #[derive(Deserialize)]
        struct RepoPermissions {
            push: Option<bool>,
            admin: Option<bool>,
        }

        #[derive(Deserialize)]
        struct Repo {
            full_name: String,
            permissions: Option<RepoPermissions>,
        }

        #[derive(Deserialize)]
        struct CollaboratorPermissions {
            permission: String,
        }

        let user: User = client.get_json("/user")?;
        let repo_info: Repo = client.get_json(&format!("/repos/{owner}/{repo}"))?;

        let mut can_push = repo_info
            .permissions
            .as_ref()
            .and_then(|p| p.push.or(p.admin))
            .unwrap_or(false);

        if !can_push {
            let collaborator: Result<CollaboratorPermissions, String> =
                client.get_json(&format!("/repos/{owner}/{repo}/collaborators/{}", user.login));
            if let Ok(info) = collaborator {
                can_push = matches!(info.permission.as_str(), "admin" | "write" | "maintain");
            }
        }

        Ok(GitHubConnectionStatus {
            login: user.login,
            can_push,
            repo_full_name: repo_info.full_name,
        })
}

pub fn publish_files(
        token: String,
        owner: String,
        repo: String,
        branch: String,
        commit_message: String,
        author_login: String,
        files: Vec<PublishFile>,
    ) -> Result<PublishResult, String> {
        if files.is_empty() {
            return Err("Nothing to publish".into());
        }

        let client = GitHubClient::new(token)?;

        #[derive(Deserialize)]
        struct RefResponse {
            object: RefObject,
        }
        #[derive(Deserialize)]
        struct RefObject {
            sha: String,
        }
        #[derive(Deserialize)]
        struct CommitResponse {
            sha: String,
            tree: TreeRef,
            html_url: Option<String>,
        }
        #[derive(Deserialize)]
        struct TreeRef {
            sha: String,
        }
        #[derive(Serialize)]
        struct BlobRequest<'a> {
            content: &'a str,
            encoding: &'a str,
        }
        #[derive(Deserialize)]
        struct BlobResponse {
            sha: String,
        }
        #[derive(Serialize)]
        struct TreeEntry {
            path: String,
            mode: String,
            #[serde(rename = "type")]
            entry_type: String,
            sha: String,
        }
        #[derive(Serialize)]
        struct TreeRequest {
            base_tree: String,
            tree: Vec<TreeEntry>,
        }
        #[derive(Deserialize)]
        struct TreeCreateResponse {
            sha: String,
        }
        #[derive(Serialize)]
        struct CommitCreateRequest {
            message: String,
            tree: String,
            parents: Vec<String>,
        }
        #[derive(Serialize)]
        struct RefUpdateRequest {
            sha: String,
        }

        let head_ref: RefResponse = client.get_json(&format!("/repos/{owner}/{repo}/git/ref/heads/{branch}"))?;
        let head_commit: CommitResponse =
            client.get_json(&format!("/repos/{owner}/{repo}/git/commits/{}", head_ref.object.sha))?;

        let mut tree_entries = Vec::new();
        let mut published_paths = Vec::new();

        for file in files {
            let encoded = STANDARD.encode(&file.content);
            let blob: BlobResponse = client.post_json(
                &format!("/repos/{owner}/{repo}/git/blobs"),
                &BlobRequest {
                    content: &encoded,
                    encoding: "base64",
                },
            )?;
            tree_entries.push(TreeEntry {
                path: file.path.clone(),
                mode: "100644".to_string(),
                entry_type: "blob".to_string(),
                sha: blob.sha,
            });
            published_paths.push(file.path);
        }

        let new_tree: TreeCreateResponse = client.post_json(
            &format!("/repos/{owner}/{repo}/git/trees"),
            &TreeRequest {
                base_tree: head_commit.tree.sha.clone(),
                tree: tree_entries,
            },
        )?;

        let new_commit: CommitResponse = client.post_json(
            &format!("/repos/{owner}/{repo}/git/commits"),
            &CommitCreateRequest {
                message: commit_message,
                tree: new_tree.sha,
                parents: vec![head_ref.object.sha],
            },
        )?;

        let _: serde_json::Value = client.patch_json(
            &format!("/repos/{owner}/{repo}/git/refs/heads/{branch}"),
            &RefUpdateRequest {
                sha: new_commit.sha.clone(),
            },
        )?;

        let commit_url = new_commit.html_url.unwrap_or_else(|| {
            format!("https://github.com/{owner}/{repo}/commit/{}", new_commit.sha)
        });

        Ok(PublishResult {
            commit_sha: new_commit.sha,
            commit_url,
            files_published: published_paths,
            author_login,
        })
}

#[cfg(test)]
mod tests {
    #[test]
    fn github_api_is_reachable() {
        let client = reqwest::blocking::Client::builder()
            .user_agent("webpro-mdx-editor")
            .build()
            .expect("client");
        let response = client
            .get("https://api.github.com/user")
            .send()
            .expect("request");
        assert_eq!(response.status().as_u16(), 401);
    }
}
