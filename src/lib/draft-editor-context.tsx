import { createContext, useContext, type ReactNode } from 'react';

const DraftEditorContext = createContext<{ slug: string } | null>(null);

export function DraftEditorProvider({ slug, children }: { slug: string; children: ReactNode }) {
  return <DraftEditorContext.Provider value={{ slug }}>{children}</DraftEditorContext.Provider>;
}

export function useDraftEditorSlug(): string {
  const ctx = useContext(DraftEditorContext);
  if (!ctx) throw new Error('DraftEditorProvider is required');
  return ctx.slug;
}

export function useDraftEditorSlugOptional(): string | null {
  return useContext(DraftEditorContext)?.slug ?? null;
}
