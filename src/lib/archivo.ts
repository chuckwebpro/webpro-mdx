/** Wrap `.` in text nodes with Inter (Archivo display type keeps round dots). */
export function wrapArchivoPeriods(html: string): string {
  return html
    .split(/(<[^>]+>)/g)
    .map((part) =>
      part.startsWith('<') ? part : part.replace(/\./g, '<span class="archivo-dot">.</span>'),
    )
    .join('');
}
