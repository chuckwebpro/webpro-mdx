import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { FrontmatterForm } from './components/frontmatter/FrontmatterForm';
import { CrescendoForm } from './components/frontmatter/CrescendoForm';
import { MdxEditorPane, type MdxEditorHandle } from './components/editor/MdxEditorPane';
import { InsertImageDialog } from './components/editor/InsertImageDialog';
import { ArticlePreview } from './components/preview/ArticlePreview';
import { validateForExport } from './lib/schema';
import { getApiMode } from './lib/browser-api';
import type { ComponentId } from './lib/components';
import { buildShotSnippet, type ShotFields } from './lib/shot-snippet';
import { ComponentDragProvider } from './lib/component-drag';
import type { DraftContent, DraftSummary } from './lib/types';
import {
  createDraft,
  deleteDraft,
  exportDraft,
  getSettings,
  importMdx,
  listDrafts,
  loadDraft,
  pickDraftsFolder,
  pickExportFolder,
  pickMdxFile,
  saveDraft,
  setDraftsDir,
  showMessage,
} from './lib/tauri';

const AUTOSAVE_MS = 2000;

export default function App() {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [draftsDir, setDraftsDirState] = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [content, setContent] = useState<DraftContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [startupError, setStartupError] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<MdxEditorHandle>(null);
  const apiMode = getApiMode();

  const refreshDrafts = useCallback(async () => {
    try {
      const [list, settings] = await Promise.all([listDrafts(), getSettings()]);
      setDrafts(list);
      setDraftsDirState(settings.draftsDir);
      setStartupError(null);
    } catch (err) {
      setStartupError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  const openDraft = useCallback(async (slug: string) => {
    const draft = await loadDraft(slug);
    setContent(draft);
    setActiveSlug(slug);
    setDirty(false);
    setSaveStatus('');
  }, []);

  const handleNew = useCallback(async () => {
    const title = window.prompt('Article title:');
    if (!title?.trim()) return;
    const draft = await createDraft(title.trim());
    await refreshDrafts();
    setContent(draft);
    setActiveSlug(draft.meta.slug);
    setDirty(false);
  }, [refreshDrafts]);

  const handleImport = useCallback(async () => {
    const path = await pickMdxFile();
    if (!path) return;
    try {
      const draft = await importMdx(path);
      await refreshDrafts();
      setContent(draft);
      setActiveSlug(draft.meta.slug);
      setDirty(false);
      await showMessage(`Imported "${draft.meta.title}"`, { title: 'Import complete' });
    } catch (err) {
      await showMessage(String(err), { title: 'Import failed', kind: 'error' });
    }
  }, [refreshDrafts]);

  const handleSettings = useCallback(async () => {
    const path = await pickDraftsFolder();
    if (!path) return;
    const settings = await setDraftsDir(path);
    setDraftsDirState(settings.draftsDir);
    await refreshDrafts();
  }, [refreshDrafts]);

  const scheduleSave = useCallback(
    (next: DraftContent) => {
      setContent(next);
      setDirty(true);
      setSaveStatus('Unsaved changes…');

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await saveDraft(next);
          setDirty(false);
          setSaveStatus('Saved');
          await refreshDrafts();
        } catch (err) {
          setSaveStatus(`Save failed: ${err}`);
        }
      }, AUTOSAVE_MS);
    },
    [refreshDrafts],
  );

  const updateMeta = useCallback(
    (meta: DraftContent['meta']) => {
      if (!content) return;
      scheduleSave({ ...content, meta });
    },
    [content, scheduleSave],
  );

  const updateBody = useCallback(
    (body: string) => {
      if (!content) return;
      scheduleSave({ ...content, body });
    },
    [content, scheduleSave],
  );

  const handleExport = useCallback(async () => {
    if (!content) return;

    const errors = validateForExport(content.meta);
    if (errors.length > 0) {
      await showMessage(errors.join('\n'), { title: 'Cannot export — fix these first', kind: 'error' });
      return;
    }

    const folder = await pickExportFolder();
    if (!folder) return;

    // Save first to ensure latest
    await saveDraft(content);
    const result = await exportDraft(content.meta.slug, folder);
    await showMessage(
      apiMode === 'browser'
        ? `Downloaded ${content.meta.slug}.mdx to your browser downloads.\n\nFor full export with images, use npm run tauri:dev.`
        : `Exported to:\n${result.exportDir}\n\n${result.imageCount} image(s) included.\n\nSee README.txt for copy instructions.`,
      { title: 'Export complete' },
    );
  }, [content]);

  const handleDelete = useCallback(async () => {
    if (!content) return;
    const confirmed = window.confirm(`Delete draft "${content.meta.title}"?`);
    if (!confirmed) return;
    await deleteDraft(content.meta.slug);
    setContent(null);
    setActiveSlug(null);
    await refreshDrafts();
  }, [content, refreshDrafts]);

  const handleInsertImage = useCallback(() => {
    if (!content) return;
    setImageDialogOpen(true);
  }, [content]);

  const handleInsertImageConfirm = useCallback(
    (fields: ShotFields) => {
      const snippet = buildShotSnippet(fields);
      editorRef.current?.insertSnippet(snippet);
    },
    [],
  );

  const handleInsertComponent = useCallback((id: ComponentId) => {
    editorRef.current?.insertComponent(id);
  }, []);

  return (
    <ComponentDragProvider onDrop={handleInsertComponent}>
    <div className="app-shell">
      {apiMode === 'browser' && (
        <div className="browser-banner">
          Browser preview mode — drafts saved in localStorage. Run <code>npm run tauri:dev</code> for
          full desktop features (import, images, file export).
        </div>
      )}
      {startupError && (
        <div className="startup-error">Failed to load drafts: {startupError}</div>
      )}
      <Sidebar
        drafts={drafts}
        activeSlug={activeSlug}
        draftsDir={draftsDir}
        onSelect={openDraft}
        onNew={handleNew}
        onImport={handleImport}
        onSettings={handleSettings}
        onInsertComponent={content ? handleInsertComponent : undefined}
      />

      <main className="editor-pane">
        {!content ? (
          <div className="empty-state">
            <h2>No article selected</h2>
            <p>Create a new article or select one from the sidebar.</p>
            <button type="button" className="btn btn-primary" onClick={handleNew}>
              + New Article
            </button>
          </div>
        ) : (
          <>
            <div className="editor-toolbar">
              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{content.meta.title}</span>
              <button type="button" className="btn btn-primary" onClick={handleExport}>
                Export
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
            <div className="editor-content">
              <FrontmatterForm meta={content.meta} onChange={updateMeta} />
              <MdxEditorPane
                ref={editorRef}
                key={content.meta.slug}
                body={content.body}
                onChange={updateBody}
                onInsertImage={handleInsertImage}
              />
              <CrescendoForm meta={content.meta} onChange={updateMeta} />
            </div>
            <div className="status-bar">
              {saveStatus || (dirty ? 'Unsaved' : 'Saved')} · {content.meta.slug}.mdx
            </div>
          </>
        )}
      </main>

      <aside className="preview-pane">
        {content ? (
          <ArticlePreview meta={content.meta} body={content.body} />
        ) : (
          <div className="empty-state">
            <p>Preview appears here when editing an article.</p>
          </div>
        )}
      </aside>

      {content && (
        <InsertImageDialog
          slug={content.meta.slug}
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          onInsert={handleInsertImageConfirm}
        />
      )}
    </div>
    </ComponentDragProvider>
  );
}
