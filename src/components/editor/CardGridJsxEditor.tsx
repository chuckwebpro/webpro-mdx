import { useCallback, useMemo } from 'react';
import {
  NestedLexicalEditor,
  useMdastNodeUpdater,
  type JsxEditorProps,
} from '@mdxeditor/editor';
import type { RootContent } from 'mdast';
import { getComponentDisplayName } from '../../lib/components';
import {
  createGridCardNode,
  getNextGridCardNumber,
  isGridCardNode,
} from '../../lib/jsx-mdast-utils';

export function CardGridJsxEditor({ mdastNode }: JsxEditorProps) {
  const updateMdastNode = useMdastNodeUpdater();
  const displayName = getComponentDisplayName(mdastNode.name ?? '');

  const children = useMemo(
    () => ('children' in mdastNode ? mdastNode.children : []) as RootContent[],
    [mdastNode],
  );

  const cardCount = useMemo(
    () => children.filter(isGridCardNode).length,
    [children],
  );

  const addCard = useCallback(() => {
    const nextN = getNextGridCardNumber(children);
    updateMdastNode({
      children: [...children, createGridCardNode(nextN)],
    } as Parameters<typeof updateMdastNode>[0]);
  }, [children, updateMdastNode]);

  return (
    <div className="jsx-block-editor">
      <span className="jsx-component-name">{displayName}</span>
      <div className="jsx-body-editor">
        <div className="jsx-body-editor-header">
          <span className="jsx-body-editor-label">Cards ({cardCount})</span>
          <button type="button" className="btn jsx-grid-add-btn" onClick={addCard}>
            + Add Card
          </button>
        </div>
        <NestedLexicalEditor
          key={cardCount}
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
