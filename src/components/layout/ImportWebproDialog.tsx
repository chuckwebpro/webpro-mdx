import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSettings, ImportWebproResult, WebproArticleSummary } from '../../lib/types';
import type { Theme } from '../../lib/theme';
import {
  importWebproArticlesFromGithub,
  importWebproArticlesLocal,
  listWebproArticles,
  listWebproArticlesLocal,
  setWebproLocalPath,
} from '../../lib/import-webpro';
import { getGithubTokenConfigured, pickDraftsFolder } from '../../lib/tauri';

type Source = 'github' | 'local';

interface Props {
  settings: AppSettings;
  theme: Theme;
  open: boolean;
  onClose: () => void;
  onSettingsChange: (settings: AppSettings) => void;
  onImported: (firstSlug: string | null) => void;
}

function formatResult(result: ImportWebproResult): string {
  const parts = [
    `${result.imported.length} imported`,
    result.skipped.length ? `${result.skipped.length} skipped (already local)` : '',
    result.failed.length ? `${result.failed.length} failed` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

export function ImportWebproDialog({
  settings,
  theme,
  open,
  onClose,
  onSettingsChange,
  onImported,
}: Props) {
  const [source, setSource] = useState<Source>('github');
  const [localPath, setLocalPath] = useState(settings.webproLocalPath ?? '');
  const [articles, setArticles] = useState<WebproArticleSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [tokenConfigured, setTokenConfigured] = useState(false);

  const importableArticles = useMemo(
    () => articles.filter((a) => !a.alreadyImported),
    [articles],
  );

  const loadArticles = useCallback(async () => {
    setLoadingList(true);
    setStatusMessage('');
    try {
      if (source === 'github') {
        const configured = await getGithubTokenConfigured();
        setTokenConfigured(configured);
        if (!configured) {
          setArticles([]);
          setStatusMessage('Add your GitHub token in Settings before importing from GitHub.');
          return;
        }
        setArticles(await listWebproArticles());
      } else {
        if (!localPath.trim()) {
          setArticles([]);
          return;
        }
        setArticles(await listWebproArticlesLocal(localPath.trim()));
      }
    } catch (err) {
      setArticles([]);
      setStatusMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingList(false);
    }
  }, [source, localPath]);

  useEffect(() => {
    if (!open) return;
    setSource('github');
    setLocalPath(settings.webproLocalPath ?? '');
    setSelected(new Set());
    setStatusMessage('');
    setArticles([]);
    getGithubTokenConfigured()
      .then(setTokenConfigured)
      .catch(() => setTokenConfigured(false));
  }, [open, settings.webproLocalPath]);

  useEffect(() => {
    if (!open) return;
    void loadArticles();
  }, [open, loadArticles]);

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      for (const slug of prev) {
        if (importableArticles.some((a) => a.slug === slug)) {
          next.add(slug);
        }
      }
      return next;
    });
  }, [importableArticles]);

  if (!open) return null;

  const toggleSelected = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handlePickLocalPath = async () => {
    const path = await pickDraftsFolder();
    if (!path) return;
    setBusy(true);
    try {
      const next = await setWebproLocalPath(path);
      setLocalPath(next.webproLocalPath ?? path);
      onSettingsChange(next);
      setSource('local');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const runImport = async (slugs: string[]) => {
    if (!slugs.length) {
      setStatusMessage('Select at least one article to import.');
      return;
    }
    setBusy(true);
    setStatusMessage('');
    try {
      const result =
        source === 'github'
          ? await importWebproArticlesFromGithub(slugs)
          : await importWebproArticlesLocal(localPath.trim(), slugs);

      const detail =
        result.failed.length > 0
          ? `\n\nFailed:\n${result.failed.map((f) => `${f.slug}: ${f.error}`).join('\n')}`
          : '';
      setStatusMessage(`${formatResult(result)}${detail}`);

      if (result.imported.length > 0) {
        onImported(result.imported[0] ?? null);
      }
      await loadArticles();
      setSelected(new Set());
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleImportSelected = () => runImport([...selected]);
  const handleImportAll = () => runImport(importableArticles.map((a) => a.slug));

  return (
    <div
      className={`settings-overlay app-chrome theme-${theme}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className="settings-dialog import-webpro-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-webpro-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-dialog-header">
          <h2 id="import-webpro-title">Import from webpro</h2>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <section className="settings-section">
          <h3>Source</h3>
          <div className="import-source-toggle">
            <label>
              <input
                type="radio"
                name="importSource"
                value="github"
                checked={source === 'github'}
                onChange={() => setSource('github')}
                disabled={busy}
              />
              GitHub ({settings.githubOwner}/{settings.githubRepo})
            </label>
            <label>
              <input
                type="radio"
                name="importSource"
                value="local"
                checked={source === 'local'}
                onChange={() => setSource('local')}
                disabled={busy}
              />
              Local folder
            </label>
          </div>

          {source === 'github' && !tokenConfigured && (
            <p className="field-hint">Configure your GitHub token in Settings first.</p>
          )}

          {source === 'local' && (
            <div className="settings-path-row" style={{ marginTop: '0.75rem' }}>
              <code className="settings-path">{localPath || 'No folder selected'}</code>
              <button type="button" className="btn" onClick={handlePickLocalPath} disabled={busy}>
                Choose…
              </button>
            </div>
          )}
        </section>

        <section className="settings-section">
          <div className="import-list-header">
            <h3>Articles</h3>
            {loadingList && <span className="field-hint">Loading…</span>}
          </div>

          {articles.length === 0 && !loadingList ? (
            <p className="field-hint">
              {source === 'local' && !localPath.trim()
                ? 'Choose your local webpro checkout to list articles.'
                : 'No articles found.'}
            </p>
          ) : (
            <ul className="import-article-list">
              {articles.map((article) => (
                <li key={article.slug} className="import-article-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.has(article.slug)}
                      disabled={busy || article.alreadyImported}
                      onChange={() => toggleSelected(article.slug)}
                    />
                    <span className="import-article-title">{article.title || article.slug}</span>
                    <span className="import-article-meta">
                      {article.slug}
                      {article.publishDate ? ` · ${article.publishDate}` : ''}
                      {article.alreadyImported ? ' · Already imported' : ''}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleImportSelected}
              disabled={busy || selected.size === 0}
            >
              Import selected
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleImportAll}
              disabled={busy || importableArticles.length === 0}
            >
              Import all
            </button>
            <button type="button" className="btn" onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </section>

        {statusMessage && <p className="settings-status">{statusMessage}</p>}
      </div>
    </div>
  );
}
