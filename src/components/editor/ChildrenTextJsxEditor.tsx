import { useCallback, useMemo } from 'react';
import { useMdastNodeUpdater, type JsxEditorProps } from '@mdxeditor/editor';
import type { PhrasingContent } from 'mdast';
import { getComponentDisplayName } from '../../lib/components';
import { InlinePropertyEditor } from './InlinePropertyEditor';

function readText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';

  if ('type' in node && node.type === 'text' && 'value' in node) {
    return String(node.value);
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(readText).join('');
  }

  return '';
}

function textChildren(value: string): PhrasingContent[] {
  return [{ type: 'text', value }];
}

/** Edits simple text children without a nested Lexical surface (works inside other JSX blocks). */
export function ChildrenTextJsxEditor({ mdastNode, descriptor }: JsxEditorProps) {
  const updateMdastNode = useMdastNodeUpdater();
  const label = useMemo(() => readText(mdastNode), [mdastNode]);
  const displayName = getComponentDisplayName(mdastNode.name ?? '');

  const onChange = useCallback(
    (values: Record<string, string>) => {
      const value = values.label ?? '';
      const children =
        descriptor.kind === 'flow'
          ? [{ type: 'paragraph' as const, children: textChildren(value) }]
          : textChildren(value);

      // Flow JSX elements accept block children; the updater type is narrower than mdast allows.
      updateMdastNode({ children: (value ? children : []) as never });
    },
    [descriptor.kind, updateMdastNode],
  );

  return (
    <div className={descriptor.kind === 'text' ? 'jsx-inline-block' : 'jsx-block-editor'}>
      <InlinePropertyEditor properties={{ label }} title={displayName} onChange={onChange} />
    </div>
  );
}
