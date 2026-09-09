import { NestedLexicalEditor } from '@mdxeditor/editor';
import type { RootContent } from 'mdast';
import { ComponentBodyToolbar } from './ComponentBodyToolbar';

interface Props<T extends RootContent> {
  block?: boolean;
  getContent: (mdastNode: T) => RootContent[];
  getUpdatedMdastNode: (mdastNode: T, children: RootContent[]) => T;
}

export function ComponentBodyEditor<T extends RootContent>({
  block = true,
  getContent,
  getUpdatedMdastNode,
}: Props<T>) {
  return (
    <div className="jsx-body-editor">
      <div className="jsx-body-editor-header">
        <span className="jsx-body-editor-label">Content</span>
        <div onMouseDown={(event) => event.preventDefault()}>
          <ComponentBodyToolbar />
        </div>
      </div>
      <NestedLexicalEditor
        block={block}
        getContent={getContent}
        getUpdatedMdastNode={getUpdatedMdastNode}
        contentEditableProps={{ className: 'jsx-body-content' }}
      />
    </div>
  );
}
