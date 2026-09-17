import { useEffect, useState } from 'react';
import type { AppSettings, GitHubConnectionStatus } from '../../lib/types';
import { getApiMode } from '../../lib/browser-api';
import type { Theme } from '../../lib/theme';
import {
  disconnectGithub,
  getGithubTokenConfigured,
  getSettings,
  pickDraftsFolder,
  setDraftsDir,
  setGithubSettings,
  setGithubToken,
  testGithubConnection,
} from '../../lib/tauri';

interface Props {
  settings: AppSettings;
  theme: Theme;
  open: boolean;
  onClose: () => void;
  onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsDialog({ settings, theme, open, onClose, onSettingsChange }: Props) {
  const [draftsDir, setDraftsDirState] = useState(settings.draftsDir);
  const [githubOwner, setGithubOwner] = useState(settings.githubOwner);
  const [githubRepo, setGithubRepo] = useState(settings.githubRepo);
  const [githubBranch, setGithubBranch] = useState(settings.githubBranch);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [connection, setConnection] = useState<GitHubConnectionStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const isDesktop = getApiMode() === 'tauri';

  useEffect(() => {
    if (!open) return;
    setDraftsDirState(settings.draftsDir);
    setGithubOwner(settings.githubOwner);
    setGithubRepo(settings.githubRepo);
    setGithubBranch(settings.githubBranch);
  }, [open, settings.draftsDir, settings.githubOwner, settings.githubRepo, settings.githubBranch]);

  useEffect(() => {
    if (!open) return;
    setConnection(null);
    setStatusMessage('');
    setTokenInput('');

    if (isDesktop) {
      getGithubTokenConfigured()
        .then(setTokenConfigured)
        .catch(() => setTokenConfigured(false));
    }
  }, [open, isDesktop]);

  if (!open) return null;

  const handlePickDraftsDir = async () => {
    const path = await pickDraftsFolder();
    if (!path) return;
    setBusy(true);
    try {
      const next = await setDraftsDir(path);
      setDraftsDirState(next.draftsDir);
      onSettingsChange(next);
      setStatusMessage('Drafts folder updated.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      setStatusMessage('Paste a GitHub personal access token first.');
      return;
    }
    setBusy(true);
    try {
      await setGithubToken(tokenInput.trim());
      setTokenConfigured(true);
      setTokenInput('');
      setStatusMessage('GitHub token saved to your OS keychain.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleTestConnection = async () => {
    setBusy(true);
    setConnection(null);
    try {
      const trimmedToken = tokenInput.trim();
      if (trimmedToken) {
        await setGithubToken(trimmedToken);
        setTokenConfigured(true);
        setTokenInput('');
      } else if (!(await getGithubTokenConfigured())) {
        setStatusMessage('Paste a GitHub personal access token first, then test the connection.');
        return;
      }

      const next = await setGithubSettings({
        githubOwner: githubOwner.trim(),
        githubRepo: githubRepo.trim(),
        githubBranch: githubBranch.trim(),
      });
      onSettingsChange(next);

      const result = await testGithubConnection();
      setConnection(result);
      const refreshed = await getSettings();
      onSettingsChange(refreshed);
      setStatusMessage(
        result.canPush
          ? `Connected as @${result.login} with write access to ${result.repoFullName}.`
          : `@${result.login} is signed in but cannot push to ${result.repoFullName}.`,
      );
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      const next = await disconnectGithub();
      setTokenConfigured(false);
      setConnection(null);
      onSettingsChange(next);
      setStatusMessage('GitHub token removed from keychain.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`settings-overlay app-chrome theme-${theme}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-dialog-header">
          <h2 id="settings-title">Settings</h2>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <section className="settings-section">
          <h3>Drafts folder</h3>
          <p className="field-hint">Local folder where article drafts are stored.</p>
          <div className="settings-path-row">
            <code className="settings-path">{draftsDir}</code>
            <button type="button" className="btn" onClick={handlePickDraftsDir} disabled={busy}>
              Change…
            </button>
          </div>
        </section>

        {isDesktop && (
          <section className="settings-section">
            <h3>Publish to GitHub</h3>
            <p className="field-hint">
              Use your own GitHub account. The repo owner must invite you as a collaborator with write
              access to <code>chuckwebpro/webpro</code> before you can publish.
            </p>

            <div className="form-row">
              <label htmlFor="githubOwner">Owner</label>
              <input
                id="githubOwner"
                value={githubOwner}
                onChange={(e) => setGithubOwner(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="githubRepo">Repo</label>
              <input
                id="githubRepo"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="githubBranch">Branch</label>
              <input
                id="githubBranch"
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
              />
            </div>

            <details className="settings-instructions">
              <summary>How to create a personal access token</summary>
              <ol>
                <li>
                  Open{' '}
                  <a
                    href="https://github.com/settings/personal-access-tokens/new"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub → Settings → Developer settings → Fine-grained tokens
                  </a>{' '}
                  and click <strong>Generate new token</strong>.
                </li>
                <li>
                  Name the token (e.g. <code>Webpro MDX Editor</code>) and set an expiration.
                </li>
                <li>
                  Under <strong>Repository access</strong>, choose{' '}
                  <strong>Only select repositories</strong> and pick{' '}
                  <code>
                    {githubOwner}/{githubRepo}
                  </code>
                  .
                </li>
                <li>
                  Under <strong>Repository permissions</strong>, set <strong>Contents</strong> to{' '}
                  <strong>Read and write</strong>.
                </li>
                <li>
                  Click <strong>Generate token</strong>, copy the token immediately (GitHub shows it
                  only once), then paste it below.
                </li>
                <li>
                  Click <strong>Save token</strong>, then <strong>Test connection</strong> to verify
                  write access.
                </li>
              </ol>
              <p className="field-hint">
                Classic PAT alternative:{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Webpro%20MDX%20Editor"
                  target="_blank"
                  rel="noreferrer"
                >
                  create a token with the <code>repo</code> scope
                </a>{' '}
                if you only have access to this repository.
              </p>
            </details>

            <div className="form-row">
              <label htmlFor="githubToken">Personal access token</label>
              <input
                id="githubToken"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={tokenConfigured ? 'Token saved — paste to replace' : 'github_pat_… or ghp_…'}
                autoComplete="off"
              />
            </div>

            <div className="settings-actions">
              <button type="button" className="btn" onClick={handleSaveToken} disabled={busy}>
                Save token
              </button>
              <button type="button" className="btn btn-primary" onClick={handleTestConnection} disabled={busy}>
                Test connection
              </button>
              {tokenConfigured && (
                <button type="button" className="btn btn-danger" onClick={handleDisconnect} disabled={busy}>
                  Disconnect
                </button>
              )}
            </div>

            {(connection || settings.githubUsername) && (
              <p className="field-hint-static">
                {connection
                  ? `@${connection.login} · ${connection.canPush ? 'Write access' : 'Read only'} · ${connection.repoFullName}`
                  : settings.githubUsername
                    ? `Last signed in as @${settings.githubUsername}`
                    : null}
              </p>
            )}

            <p className="field-hint">
              Tokens are stored in your OS keychain on this machine only. See{' '}
              <a
                href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
                target="_blank"
                rel="noreferrer"
              >
                GitHub PAT documentation
              </a>{' '}
              for more details.
            </p>
          </section>
        )}

        {statusMessage && <p className="settings-status">{statusMessage}</p>}
      </div>
    </div>
  );
}
