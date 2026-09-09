import { addNestedEditorChild$, realmPlugin } from '@mdxeditor/editor';
import { NestedFormattingShortcutsPlugin } from './NestedFormattingShortcutsPlugin';

export const nestedEditorFormattingPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addNestedEditorChild$]: NestedFormattingShortcutsPlugin,
    });
  },
});
