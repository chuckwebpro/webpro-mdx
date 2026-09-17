import { Verdict } from './Verdict';
import { Specimen } from './Specimen';
import { SpecimenTag } from './SpecimenTag';
import { PullQuote } from './PullQuote';
import { Shot } from './Shot';
import { RockGrid, Rock } from './Rock';
import { CodeBlock } from './CodeBlock';
import { CraftGrid, CraftRow } from './Craft';
import { SourceNote } from './SourceNote';
import { ClientQuote } from './ClientQuote';
import { CodeRewriteLabel } from './CodeRewriteLabel';
import { StatRow, StatCard } from './Stat';
import { EffortCompare, EffortCol } from './EffortCompare';
import { SocialDial } from './SocialDial';
import { CtaBlock } from './CtaBlock';
import { ChannelTable, ChannelRow } from './Channel';
import { CardGrid, GridCard } from './CardGrid';

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
  ClientQuote,
  CodeRewriteLabel,
  StatRow,
  StatCard,
  EffortCompare,
  EffortCol,
  SocialDial,
  CtaBlock,
  ChannelTable,
  ChannelRow,
  CardGrid,
  GridCard,
};

export type MdxComponentName = keyof typeof mdxComponents;
