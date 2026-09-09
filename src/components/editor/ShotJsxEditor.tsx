import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useMdastNodeUpdater, type JsxEditorProps } from '@mdxeditor/editor';
import { getComponentDisplayName } from '../../lib/components';
import { defaultAltFromFilename, storeBrowserImageFile } from '../../lib/draft-assets';
import { useDraftEditorSlug } from '../../lib/draft-editor-context';
import { getApiMode } from '../../lib/browser-api';
import { copyImageToDraft, pickImageFile, showMessage } from '../../lib/tauri';

function isExpressionValue(
  value: unknown,
): value is { type: string; value: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'value' in value &&
    typeof (value as { value: unknown }).value === 'string'
  );
}

function isMdxJsxAttribute(
  value: unknown,
): value is { type: 'mdxJsxAttribute'; name: string; value: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: string }).type === 'mdxJsxAttribute' &&
    typeof (value as { name?: unknown }).name === 'string'
  );
}

const SHOT_PROPS = ['src', 'alt', 'rank', 'caption'] as const;

export function ShotJsxEditor({ mdastNode, descriptor }: JsxEditorProps) {
  const updateMdastNode = useMdastNodeUpdater();
  const slug = useDraftEditorSlug();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const displayName = getComponentDisplayName(mdastNode.name ?? '');

  const properties = useMemo(
    () =>
      descriptor.props.reduce<Record<string, string>>((acc, { name }) => {
        const attribute = mdastNode.attributes.find((attr) =>
          isMdxJsxAttribute(attr) ? attr.name === name : false,
        );
        if (attribute) {
          if (isExpressionValue(attribute.value)) {
            acc[name] = attribute.value.value;
            return acc;
          }
          if (typeof attribute.value === 'string') {
            acc[name] = attribute.value;
            return acc;
          }
        }
        acc[name] = '';
        return acc;
      }, {}),
    [mdastNode, descriptor],
  );

  const [local, setLocal] = useState(properties);

  useEffect(() => {
    setLocal(properties);
  }, [properties]);

  const commit = useCallback(
    (values: Record<string, string>) => {
      const updatedAttributes: Array<{
        type: 'mdxJsxAttribute';
        name: string;
        value: string | { type: 'mdxJsxAttributeValueExpression'; value: string };
      }> = [];

      for (const prop of descriptor.props) {
        const value = values[prop.name] ?? '';

        if (value === '' && !prop.required) {
          continue;
        }

        if (prop.type === 'expression') {
          if (value === '') continue;
          updatedAttributes.push({
            type: 'mdxJsxAttribute',
            name: prop.name,
            value: { type: 'mdxJsxAttributeValueExpression', value },
          });
          continue;
        }

        updatedAttributes.push({
          type: 'mdxJsxAttribute',
          name: prop.name,
          value,
        });
      }

      updateMdastNode({ attributes: updatedAttributes });
    },
    [descriptor, updateMdastNode],
  );

  const applyPatch = useCallback(
    (patch: Partial<Record<(typeof SHOT_PROPS)[number], string>>) => {
      setLocal((prev) => {
        const next = { ...prev, ...patch };
        commit(next);
        return next;
      });
    },
    [commit],
  );

  const handleFieldChange = (name: string, value: string) => {
    setLocal((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldBlur = () => {
    commit(local);
  };

  const insertFileSrc = useCallback(
    (relPath: string, filename: string) => {
      const patch: Partial<Record<(typeof SHOT_PROPS)[number], string>> = { src: relPath };
      if (!local.alt.trim()) {
        patch.alt = defaultAltFromFilename(filename);
      }
      applyPatch(patch);
    },
    [applyPatch, local.alt],
  );

  const handleBrowseTauri = async () => {
    setPicking(true);
    try {
      const path = await pickImageFile();
      if (!path) return;
      const relPath = await copyImageToDraft(slug, path);
      const filename = path.split(/[/\\]/).pop() ?? 'image.png';
      insertFileSrc(relPath, filename);
    } catch (err) {
      await showMessage(String(err), { title: 'Image insert failed', kind: 'error' });
    } finally {
      setPicking(false);
    }
  };

  const handleBrowse = () => {
    if (getApiMode() === 'tauri') {
      void handleBrowseTauri();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPicking(true);
    try {
      const relPath = await storeBrowserImageFile(slug, file);
      insertFileSrc(relPath, file.name);
    } catch (err) {
      await showMessage(String(err), { title: 'Image insert failed', kind: 'error' });
    } finally {
      setPicking(false);
    }
  };

  return (
    <div className="jsx-block-editor">
      <div className="jsx-inline-props">
        <div className="jsx-inline-props-title">{displayName}</div>
        <div className="jsx-inline-props-grid">
          <label className="jsx-inline-prop jsx-shot-src-row">
            <span className="jsx-inline-prop-label">src</span>
            <div className="jsx-shot-src-controls">
              <input
                className="jsx-inline-prop-input"
                value={local.src ?? ''}
                onChange={(e) => handleFieldChange('src', e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="/images/seo-insights/… or choose file"
              />
              <button
                type="button"
                className="btn jsx-shot-browse"
                onClick={handleBrowse}
                disabled={picking}
              >
                {picking ? '…' : 'Choose file'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="jsx-shot-file-input"
                onChange={(e) => void handleFileInput(e)}
              />
            </div>
          </label>

          {(['alt', 'rank', 'caption'] as const).map((name) => (
            <label key={name} className="jsx-inline-prop">
              <span className="jsx-inline-prop-label">{name}</span>
              <input
                className="jsx-inline-prop-input"
                value={local[name] ?? ''}
                onChange={(e) => handleFieldChange(name, e.target.value)}
                onBlur={handleFieldBlur}
                placeholder={name}
              />
            </label>
          ))}
        </div>
        <p className="jsx-shot-hint">Paste a public URL in src, or choose a file to store in the draft assets folder.</p>
      </div>
    </div>
  );
}
