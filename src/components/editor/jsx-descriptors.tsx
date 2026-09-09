import { type JsxComponentDescriptor } from '@mdxeditor/editor';
import { ChildrenTextJsxEditor } from './ChildrenTextJsxEditor';
import { CraftGridJsxEditor } from './CraftGridJsxEditor';
import { CraftRowJsxEditor } from './CraftRowJsxEditor';
import { InlinePropsJsxEditor } from './InlinePropsJsxEditor';
import { RockGridJsxEditor } from './RockGridJsxEditor';
import { RockJsxEditor } from './RockJsxEditor';
import { ShotJsxEditor } from './ShotJsxEditor';

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
  {
    name: 'SpecimenTag',
    kind: 'flow',
    props: [],
    hasChildren: true,
    Editor: ChildrenTextJsxEditor,
  },
  flow('PullQuote', []),
  {
    name: 'Shot',
    kind: 'flow',
    props: [
      { name: 'src', type: 'string', required: true },
      { name: 'alt', type: 'string', required: true },
      { name: 'rank', type: 'number' },
      { name: 'caption', type: 'string' },
    ],
    hasChildren: false,
    Editor: ShotJsxEditor,
  },
  {
    name: 'RockGrid',
    kind: 'flow',
    props: [],
    hasChildren: true,
    Editor: RockGridJsxEditor,
  },
  {
    name: 'Rock',
    kind: 'flow',
    props: [
      { name: 'n', type: 'expression', required: true },
      { name: 'label', type: 'string', required: true },
      { name: 'meta', type: 'string' },
    ],
    hasChildren: true,
    Editor: RockJsxEditor,
  },
  flow('CodeBlock', [
    { name: 'label', type: 'string' },
    { name: 'html', type: 'expression', required: true },
  ], false),
  {
    name: 'CraftGrid',
    kind: 'flow',
    props: [],
    hasChildren: true,
    Editor: CraftGridJsxEditor,
  },
  {
    name: 'CraftRow',
    kind: 'flow',
    props: [
      { name: 'n', type: 'string', required: true },
      { name: 'label', type: 'string', required: true },
    ],
    hasChildren: true,
    Editor: CraftRowJsxEditor,
  },
  flow('SourceNote', []),
];
