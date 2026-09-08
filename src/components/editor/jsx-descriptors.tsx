import { type JsxComponentDescriptor } from '@mdxeditor/editor';
import { InlinePropsJsxEditor } from './InlinePropsJsxEditor';

const flow = (
  name: string,
  props: JsxComponentDescriptor['props'],
  hasChildren = true,
): JsxComponentDescriptor => ({
  name,
  kind: 'flow',
  props,
  hasChildren,
  Editor: InlinePropsJsxEditor,
});
export const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  flow('Verdict', [{ name: 'label', type: 'string' }]),
  flow('Specimen', [
    { name: 'from', type: 'string', required: true },
    { name: 'subjectFlag', type: 'string' },
    { name: 'subject', type: 'string', required: true },
  ]),
  flow('SpecimenTag', [], true),
  flow('PullQuote', []),
  flow('Shot', [
    { name: 'src', type: 'string', required: true },
    { name: 'alt', type: 'string', required: true },
    { name: 'rank', type: 'number' },
    { name: 'caption', type: 'string' },
  ], false),
  flow('RockGrid', []),
  flow('Rock', [
    { name: 'n', type: 'expression', required: true },
    { name: 'label', type: 'string', required: true },
    { name: 'meta', type: 'string' },
  ]),
  flow('CodeBlock', [
    { name: 'label', type: 'string' },
    { name: 'html', type: 'expression', required: true },
  ], false),
  flow('CraftGrid', []),
  flow('CraftRow', [
    { name: 'n', type: 'string', required: true },
    { name: 'label', type: 'string', required: true },
  ]),
  flow('SourceNote', []),
];
