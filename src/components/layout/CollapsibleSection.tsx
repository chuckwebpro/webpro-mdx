import { useId, useState, type ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  className = '',
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section
      className={`collapsible-section form-section${open ? ' is-open' : ' is-collapsed'}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="collapsible-section-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="collapsible-section-chevron" aria-hidden="true">
          ▾
        </span>
        <span className="form-section-title">{title}</span>
      </button>
      <div id={bodyId} className="collapsible-section-body form-section-body">
        {children}
      </div>
    </section>
  );
}
