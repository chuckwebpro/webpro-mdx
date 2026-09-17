const SERVICE: &str = "webpro-mdx-editor";
const GITHUB_TOKEN_USER: &str = "github-token";

fn github_token_entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new(SERVICE, GITHUB_TOKEN_USER).map_err(|e| e.to_string())
}

pub fn save_github_token(token: &str) -> Result<(), String> {
    let entry = github_token_entry()?;
    entry.set_password(token).map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(saved) if saved == token => Ok(()),
        Ok(_) => Err("GitHub token could not be verified after saving".into()),
        Err(err) => Err(format!("GitHub token saved but could not be read back: {err}")),
    }
}

pub fn load_github_token() -> Result<Option<String>, String> {
    match github_token_entry() {
        Ok(entry) => match entry.get_password() {
            Ok(token) if !token.trim().is_empty() => Ok(Some(token)),
            Ok(_) => Ok(None),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}

pub fn clear_github_token() -> Result<(), String> {
    match github_token_entry() {
        Ok(entry) => match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(err) => Err(err.to_string()),
        },
        Err(err) => Err(err.to_string()),
    }
}

pub fn has_github_token() -> Result<bool, String> {
    Ok(load_github_token()?.is_some())
}
