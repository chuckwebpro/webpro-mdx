import { Verdict } from './Verdict';
import { Specimen } from './Specimen';
import { SpecimenTag } from './SpecimenTag';
import { PullQuote } from './PullQuote';
import { Shot } from './Shot';
import { RockGrid, Rock } from './Rock';
import { CodeBlock } from './CodeBlock';
import { CraftGrid, CraftRow } from './Craft';
import { SourceNote } from './SourceNote';

export const mdxComponents = {
  Verdict,
  Specimen,
  SpecimenTag,
  PullQuote,
  Shot,
  RockGrid,
  Rock,
  CodeBlock,
  CraftGrid,
  CraftRow,
  SourceNote,
};

export type MdxComponentName = keyof typeof mdxComponents;
