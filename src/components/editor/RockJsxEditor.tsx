import { useLexicalNodeRemove, type JsxEditorProps } from '@mdxeditor/editor';
import { InlinePropsJsxEditor } from './InlinePropsJsxEditor';

export function RockJsxEditor(props: JsxEditorProps) {
  const removeNode = useLexicalNodeRemove();

  return (
    <div className="jsx-rock-item">
      <button
        type="button"
        className="btn btn-danger btn-icon jsx-rock-remove"
        onClick={removeNode}
        aria-label="Remove rock item"
        title="Remove rock item"
      >
        ×
      </button>
      <InlinePropsJsxEditor {...props} />
    </div>
  );
}
