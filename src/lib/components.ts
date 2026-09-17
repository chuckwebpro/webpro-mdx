export type ComponentId = keyof typeof COMPONENT_TEMPLATES;

export interface ComponentCatalogItem {
  id: ComponentId;
  label: string;
  description: string;
  group: 'Callouts' | 'Media' | 'Lists' | 'Data' | 'Other';
}

export const COMPONENT_TEMPLATES = {
  Verdict: `<Verdict>
  Your truth statement here.
</Verdict>`,
  PullQuote: `<PullQuote>
  A memorable one- or two-sentence pull quote.
</PullQuote>`,
  ClientQuote: `<ClientQuote attribution="Name, Title">
  "Client testimonial quote goes here."
</ClientQuote>`,
  Specimen: `<Specimen
  from="Google Search Console · Automated Notification"
  subjectFlag="Subject highlight"
  subject=" rest of subject line"
>
  Notice body text goes here.

  <SpecimenTag>Tag label</SpecimenTag>
</Specimen>`,
  Shot: `<Shot
  src="/images/seo-insights/screenshot.png"
  alt="Describe the image"
  rank={3}
  caption="Optional caption."
/>`,
  RockGrid: `<RockGrid>
  <Rock n={1} label="First item title" meta="Quick Win">
    Optional description paragraph.
  </Rock>
  <Rock n={2} label="Second item title" />
</RockGrid>`,
  CraftGrid: `<CraftGrid>
  <CraftRow n="A" label="First discipline">
    Description paragraph.
  </CraftRow>
  <CraftRow n="B" label="Second discipline">
    Description paragraph.
  </CraftRow>
</CraftGrid>`,
  StatRow: `<StatRow>
  <StatCard value="94%" label="Of Google clicks go to organic results" />
  <StatCard value="68.7%" label="Top 3 organic results capture" />
</StatRow>`,
  EffortCompare: `<EffortCompare>
  <EffortCol
    variant="low"
    title="Low effort page"
    items={[
      'First low-effort item',
      'Second low-effort item',
    ]}
  />
  <EffortCol
    variant="high"
    title="High effort page"
    items={[
      'First high-effort item',
      'Second high-effort item',
    ]}
  />
</EffortCompare>`,
  ChannelTable: `<ChannelTable>
  <ChannelRow channel="Google" does="Captures existing intent.">
    Orthodontic fit description.
  </ChannelRow>
  <ChannelRow channel="Facebook" does="Manufactures awareness.">
    Orthodontic fit description.
  </ChannelRow>
</ChannelTable>`,
  CodeBlock: `{/* prettier-ignore */}
<CodeBlock
  label="index.html — what the marketer wrote"
  html={\`<span class="cm">&lt;!-- comment --&gt;</span><br><span class="tg">&lt;title&gt;</span>Page title<span class="tg">&lt;/title&gt;</span>\`}
/>`,
  CodeRewriteLabel: `<CodeRewriteLabel label="▼ Google's rewrite engine ▼" />`,
  SourceNote: `<SourceNote>
  Source attribution text.
</SourceNote>`,
} as const;

export const COMPONENT_CATALOG: ComponentCatalogItem[] = [
  { id: 'Verdict', label: 'Verdict', description: 'Truth callout box', group: 'Callouts' },
  { id: 'PullQuote', label: 'Quote', description: 'Editorial pull quote', group: 'Callouts' },
  { id: 'ClientQuote', label: 'Client Quote', description: 'Testimonial card with attribution', group: 'Callouts' },
  { id: 'Specimen', label: 'Specimen', description: 'Faux notification card', group: 'Callouts' },
  { id: 'SourceNote', label: 'Source Note', description: 'Citation footnote', group: 'Callouts' },
  { id: 'Shot', label: 'Image', description: 'Image from URL or file upload', group: 'Media' },
  { id: 'RockGrid', label: 'Rock Grid', description: 'Numbered checklist', group: 'Lists' },
  { id: 'CraftGrid', label: 'Craft Grid', description: 'Lettered list', group: 'Lists' },
  { id: 'StatRow', label: 'Stat Row', description: 'Row of stat highlight cards', group: 'Data' },
  { id: 'EffortCompare', label: 'Effort Compare', description: 'Low vs high effort columns', group: 'Data' },
  { id: 'ChannelTable', label: 'Channel Table', description: 'Channel comparison table', group: 'Data' },
  { id: 'CodeBlock', label: 'Code Block', description: 'Syntax-colored terminal block', group: 'Other' },
  { id: 'CodeRewriteLabel', label: 'Code Rewrite Label', description: 'Pill label between code blocks', group: 'Other' },
];

export const DRAG_MIME = 'application/x-webpro-component';

/** Editor-facing labels for MDX component tag names. */
export const JSX_COMPONENT_DISPLAY_NAMES: Record<string, string> = {
  Shot: 'Image',
  PullQuote: 'Quote',
};

export function getComponentDisplayName(name: string): string {
  return JSX_COMPONENT_DISPLAY_NAMES[name] ?? name;
}

export function getComponentTemplate(id: string): string | undefined {
  return COMPONENT_TEMPLATES[id as ComponentId];
}
