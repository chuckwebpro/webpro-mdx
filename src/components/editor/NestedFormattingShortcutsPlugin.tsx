import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  COMMAND_PRIORITY_HIGH,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

function hasControlModifier(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey;
}

/** Ensures Ctrl/Cmd+B/I/U and undo/redo work in nested component editors. */
export function NestedFormattingShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (!hasControlModifier(event)) return false;

          const key = event.key.toLowerCase();
          if (key === 'b') {
            event.preventDefault();
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }
          if (key === 'i') {
            event.preventDefault();
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }
          if (key === 'u') {
            event.preventDefault();
            return editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }
          if (key === 'z' && !event.shiftKey) {
            event.preventDefault();
            return editor.dispatchCommand(UNDO_COMMAND, undefined);
          }
          if (key === 'y' || (key === 'z' && event.shiftKey)) {
            event.preventDefault();
            return editor.dispatchCommand(REDO_COMMAND, undefined);
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}
