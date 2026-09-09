import { useCallback, useMemo } from 'react';
import {
  NestedLexicalEditor,
  useMdastNodeUpdater,
  type JsxEditorProps,
} from '@mdxeditor/editor';
import type { RootContent } from 'mdast';
import { getComponentDisplayName } from '../../lib/components';
import {
  createCraftRowNode,
  getNextCraftRowLetter,
  isCraftRowNode,
} from '../../lib/jsx-mdast-utils';

export function CraftGridJsxEditor({ mdastNode }: JsxEditorProps) {
  const updateMdastNode = useMdastNodeUpdater();
  const displayName = getComponentDisplayName(mdastNode.name ?? '');

  const children = useMemo(
    () => ('children' in mdastNode ? mdastNode.children : []) as RootContent[],
    [mdastNode],
  );

  const rowCount = useMemo(
    () => children.filter(isCraftRowNode).length,
    [children],
  );

  const addRow = useCallback(() => {
    const nextLetter = getNextCraftRowLetter(children);
    updateMdastNode({
      children: [...children, createCraftRowNode(nextLetter)],
    } as Parameters<typeof updateMdastNode>[0]);
  }, [children, updateMdastNode]);

  return (
    <div className="jsx-block-editor">
      <span className="jsx-component-name">{displayName}</span>
      <div className="jsx-body-editor">
        <div className="jsx-body-editor-header">
          <span className="jsx-body-editor-label">Items ({rowCount})</span>
          <button type="button" className="btn jsx-grid-add-btn" onClick={addRow}>
            + Add Row
          </button>
        </div>
        <NestedLexicalEditor
          key={rowCount}
          block
          getContent={(node) => ('children' in node ? node.children : [])}
          getUpdatedMdastNode={(node, newChildren) =>
            ({ ...node, children: newChildren }) as typeof node
          }
          contentEditableProps={{ className: 'jsx-body-content' }}
        />
      </div>
    </div>
  );
}
