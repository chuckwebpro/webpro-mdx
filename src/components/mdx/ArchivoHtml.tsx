import { wrapArchivoPeriods } from '../../lib/archivo';

interface Props {
  html: string;
  as?: 'span' | 'h4' | 'p';
  className?: string;
}

export function ArchivoHtml({ html, as: Tag = 'span', className }: Props) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: wrapArchivoPeriods(html) }}
    />
  );
}
