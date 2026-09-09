import { useLexicalNodeRemove, type JsxEditorProps } from '@mdxeditor/editor';
import { InlinePropsJsxEditor } from './InlinePropsJsxEditor';

export function CraftRowJsxEditor(props: JsxEditorProps) {
  const removeNode = useLexicalNodeRemove();

  return (
    <div className="jsx-rock-item">
      <button
        type="button"
        className="btn btn-danger btn-icon jsx-rock-remove"
        onClick={removeNode}
        aria-label="Remove craft row"
        title="Remove craft row"
      >
        ×
      </button>
      <InlinePropsJsxEditor {...props} />
    </div>
  );
}
