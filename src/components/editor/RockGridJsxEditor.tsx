import { useCallback, useMemo } from 'react';
import {
  NestedLexicalEditor,
  useMdastNodeUpdater,
  type JsxEditorProps,
} from '@mdxeditor/editor';
import type { RootContent } from 'mdast';
import { getComponentDisplayName } from '../../lib/components';
import {
  createRockNode,
  getNextRockNumber,
  isRockNode,
} from '../../lib/jsx-mdast-utils';

export function RockGridJsxEditor({ mdastNode }: JsxEditorProps) {
  const updateMdastNode = useMdastNodeUpdater();
  const displayName = getComponentDisplayName(mdastNode.name ?? '');

  const children = useMemo(
    () => ('children' in mdastNode ? mdastNode.children : []) as RootContent[],
    [mdastNode],
  );

  const rockCount = useMemo(
    () => children.filter(isRockNode).length,
    [children],
  );

  const addRock = useCallback(() => {
    const nextN = getNextRockNumber(children);
    updateMdastNode({
      children: [...children, createRockNode(nextN)],
    } as Parameters<typeof updateMdastNode>[0]);
  }, [children, mdastNode.children, updateMdastNode]);

  return (
    <div className="jsx-block-editor">
      <span className="jsx-component-name">{displayName}</span>
      <div className="jsx-body-editor">
        <div className="jsx-body-editor-header">
          <span className="jsx-body-editor-label">Items ({rockCount})</span>
          <button type="button" className="btn jsx-grid-add-btn" onClick={addRock}>
            + Add Rock
          </button>
        </div>
        <NestedLexicalEditor
          key={rockCount}
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
