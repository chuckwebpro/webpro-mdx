import {

  forwardRef,

  useCallback,

  useEffect,

  useImperativeHandle,

  useRef,

} from 'react';

import {

  MDXEditor,

  headingsPlugin,

  listsPlugin,

  quotePlugin,

  markdownShortcutPlugin,

  thematicBreakPlugin,

  tablePlugin,

  linkPlugin,

  linkDialogPlugin,

  jsxPlugin,

  toolbarPlugin,

  UndoRedo,

  BoldItalicUnderlineToggles,

  BlockTypeSelect,

  CreateLink,

  InsertTable,

  ListsToggle,

  Separator,

  type MDXEditorMethods,

} from '@mdxeditor/editor';

import '@mdxeditor/editor/style.css';

import { getComponentTemplate, type ComponentId } from '../../lib/components';

import { useComponentDrag } from '../../lib/component-drag';

import { jsxComponentDescriptors } from './jsx-descriptors';



export interface MdxEditorHandle {

  insertComponent: (id: ComponentId) => void;

}



interface Props {

  body: string;

  onChange: (body: string) => void;

}



export const MdxEditorPane = forwardRef<MdxEditorHandle, Props>(function MdxEditorPane(

  { body, onChange },

  ref,

) {

  const editorRef = useRef<MDXEditorMethods>(null);

  const skipExternalSync = useRef(false);

  const { dropTargetActive, registerDropZone } = useComponentDrag();



  const setDropZoneRef = useCallback(

    (el: HTMLDivElement | null) => {

      registerDropZone(el);

    },

    [registerDropZone],

  );



  const appendMarkdown = useCallback(

    (snippet: string) => {

      const editor = editorRef.current;

      if (!editor) return;



      const current = editor.getMarkdown();

      const separator = current.trim().length > 0 ? '\n\n' : '';

      const next = `${current}${separator}${snippet.trim()}\n\n`;

      skipExternalSync.current = true;

      editor.setMarkdown(next);

      onChange(next);

    },

    [onChange],

  );



  const insertTemplate = useCallback(

    (id: ComponentId) => {

      const template = getComponentTemplate(id);

      if (!template) return;

      appendMarkdown(template);

    },

    [appendMarkdown],

  );



  useImperativeHandle(

    ref,

    () => ({

      insertComponent: insertTemplate,

    }),

    [insertTemplate, appendMarkdown],

  );



  useEffect(() => {

    if (skipExternalSync.current) {

      skipExternalSync.current = false;

      return;

    }

    const editor = editorRef.current;

    if (!editor) return;

    const current = editor.getMarkdown();

    if (current !== body) {

      editor.setMarkdown(body);

    }

  }, [body]);



  const handleChange = useCallback(

    (markdown: string) => {

      skipExternalSync.current = true;

      onChange(markdown);

    },

    [onChange],

  );



  return (

    <section className="body-editor-section">

      <div className="body-editor-header">

        <h3>5. Article body</h3>

      </div>



      <div

        ref={setDropZoneRef}

        className={`mdx-editor-wrap${dropTargetActive ? ' drag-over' : ''}`}

      >

        {dropTargetActive && <div className="drop-hint">Drop component here</div>}

        <MDXEditor

          ref={editorRef}

          markdown={body}

          onChange={handleChange}

          plugins={[

            jsxPlugin({ jsxComponentDescriptors }),

            headingsPlugin(),

            listsPlugin(),

            quotePlugin(),

            thematicBreakPlugin(),

            tablePlugin(),

            linkPlugin(),

            linkDialogPlugin(),

            markdownShortcutPlugin(),

            toolbarPlugin({

              toolbarContents: () => (

                <>

                  <UndoRedo />

                  <Separator />

                  <BoldItalicUnderlineToggles />

                  <Separator />

                  <BlockTypeSelect />

                  <Separator />

                  <ListsToggle />

                  <Separator />

                  <CreateLink />

                  <InsertTable />

                </>

              ),

            }),

          ]}

          contentEditableClassName="insights-body"

        />

      </div>

    </section>

  );

});


