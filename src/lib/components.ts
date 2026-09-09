export type ComponentId = keyof typeof COMPONENT_TEMPLATES;

export interface ComponentCatalogItem {
  id: ComponentId;
  label: string;
  description: string;
  group: 'Callouts' | 'Media' | 'Lists' | 'Other';
}

export const COMPONENT_TEMPLATES = {
  Verdict: `<Verdict>
  Your truth statement here.
</Verdict>`,
  PullQuote: `<PullQuote>
  A memorable one- or two-sentence pull quote.
</PullQuote>`,
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
  CodeBlock: `{/* prettier-ignore */}
<CodeBlock
  label="filename.txt - built by WEBPRO"
  html={\`<span class="c"># comment</span> <span class="u">User-agent:</span> *\`}
/>`,
  CraftGrid: `<CraftGrid>
  <CraftRow n="A" label="First discipline">
    Description paragraph.
  </CraftRow>
  <CraftRow n="B" label="Second discipline">
    Description paragraph.
  </CraftRow>
</CraftGrid>`,
  SourceNote: `<SourceNote>
  Source attribution text.
</SourceNote>`,
} as const;

export const COMPONENT_CATALOG: ComponentCatalogItem[] = [
  { id: 'Verdict', label: 'Verdict', description: 'Truth callout box', group: 'Callouts' },
  { id: 'PullQuote', label: 'Quote', description: 'Large bordered quote', group: 'Callouts' },
  { id: 'Specimen', label: 'Specimen', description: 'Faux notification card', group: 'Callouts' },
  { id: 'SourceNote', label: 'Source Note', description: 'Citation footnote', group: 'Callouts' },
  { id: 'Shot', label: 'Image', description: 'Image from URL or file upload', group: 'Media' },
  { id: 'RockGrid', label: 'Rock Grid', description: 'Numbered checklist', group: 'Lists' },
  { id: 'CraftGrid', label: 'Craft Grid', description: 'Lettered list', group: 'Lists' },
  { id: 'CodeBlock', label: 'Code Block', description: 'Syntax-colored code', group: 'Other' },
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
