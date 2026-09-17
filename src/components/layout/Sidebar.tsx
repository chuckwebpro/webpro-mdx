import { plainTitle } from '../../lib/html-text';
import type { DraftSummary } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import type { Theme } from '../../lib/theme';
import { ComponentPalette } from './ComponentPalette';
import { ThemeSwitch } from './ThemeSwitch';
import type { ComponentId } from '../../lib/components';

interface Props {
  drafts: DraftSummary[];
  activeSlug: string | null;
  draftsDir: string;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onSelect: (slug: string) => void;
  onNew: () => void;
  onImport: () => void;
  onImportWebpro: () => void;
  onSettings: () => void;
  showImportWebpro?: boolean;
  onInsertComponent?: (id: ComponentId) => void;
}

export function Sidebar({
  drafts,
  activeSlug,
  draftsDir,
  theme,
  onThemeChange,
  onSelect,
  onNew,
  onImport,
  onImportWebpro,
  onSettings,
  showImportWebpro = false,
  onInsertComponent,
}: Props) {
  const hasArticle = Boolean(activeSlug);

  return (
    <aside className={`sidebar app-chrome theme-${theme}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <div className="sidebar-header-copy">
            <h1>Webpro MDX Editor</h1>
            <p>SEO Insights articles</p>
          </div>
          <ThemeSwitch theme={theme} onChange={onThemeChange} />
        </div>
      </div>

      <div className="sidebar-actions">
        <button type="button" className="btn btn-primary" onClick={onNew}>
          + New
        </button>
        <button type="button" className="btn" onClick={onImport}>
          Import
        </button>
        {showImportWebpro && (
          <button type="button" className="btn" onClick={onImportWebpro}>
            From webpro…
          </button>
        )}
        <button type="button" className="btn" onClick={onSettings} title="Drafts folder">
          ⚙
        </button>
      </div>

      <div className="sidebar-section-label">Articles</div>
      <ul className="draft-list">
        {drafts.length === 0 && (
          <li className="sidebar-empty">No drafts yet.</li>
        )}
        {drafts.map((draft) => (
          <li key={draft.slug}>
            <button
              type="button"
              className={`draft-item ${activeSlug === draft.slug ? 'active' : ''}`}
              onClick={() => onSelect(draft.slug)}
            >
              <div className="draft-item-title">
                {draft.draft && <span className="draft-badge">Draft</span>}
                {plainTitle(draft.title) || draft.slug}
              </div>
              <div className="draft-item-meta">
                {draft.publishDate} · {formatDate(draft.lastEdited)}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <ComponentPalette disabled={!hasArticle} onInsert={onInsertComponent} />

      <div className="status-bar" title={draftsDir}>
        {draftsDir.length > 40 ? '…' + draftsDir.slice(-37) : draftsDir}
      </div>
    </aside>
  );
}
