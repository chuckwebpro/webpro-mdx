import type { DraftMeta } from '../../lib/types';
import {
  DEFAULT_CRESCENDO_BOOK_SUBTITLE,
  DEFAULT_CRESCENDO_BOOK_TITLE,
  DEFAULT_CRESCENDO_EYEBROW,
  DEFAULT_CRESCENDO_PRIMARY_CTA_HREF,
  DEFAULT_CRESCENDO_PRIMARY_CTA_LABEL,
  DEFAULT_CRESCENDO_SECONDARY_CTA_HREF,
  DEFAULT_CRESCENDO_SECONDARY_CTA_LABEL,
} from '../../lib/types';

interface Props {
  meta: DraftMeta;
  onChange: (meta: DraftMeta) => void;
}

export function CrescendoForm({ meta, onChange }: Props) {
  const update = (patch: Partial<DraftMeta>) => {
    onChange({ ...meta, ...patch });
  };

  const addCrescendoParagraph = () => {
    update({ crescendoBody: [...meta.crescendoBody, ''] });
  };

  const updateCrescendoParagraph = (index: number, value: string) => {
    const next = [...meta.crescendoBody];
    next[index] = value;
    update({ crescendoBody: next });
  };

  const removeCrescendoParagraph = (index: number) => {
    update({ crescendoBody: meta.crescendoBody.filter((_, i) => i !== index) });
  };

  return (
    <section className="crescendo-form-section">
      <h3 className="form-section-title">6. Crescendo</h3>
      <div className="form-section-body">
        <div className="form-row">
          <label htmlFor="crescendoEyebrow">Eyebrow</label>
          <input
            id="crescendoEyebrow"
            value={meta.crescendoEyebrow ?? ''}
            onChange={(e) => update({ crescendoEyebrow: e.target.value || undefined })}
            placeholder={DEFAULT_CRESCENDO_EYEBROW}
          />
        </div>
        <div className="form-row">
          <label htmlFor="crescendoHeading">Heading</label>
          <input
            id="crescendoHeading"
            value={meta.crescendoHeading ?? ''}
            onChange={(e) => update({ crescendoHeading: e.target.value || undefined })}
            placeholder="Four emails. Still the same book."
          />
        </div>
        <div className="form-row">
          <label>Body paragraphs</label>
          <div className="crescendo-paragraphs">
            {meta.crescendoBody.map((para, i) => (
              <div key={i} className="crescendo-row">
                <textarea
                  value={para}
                  onChange={(e) => updateCrescendoParagraph(i, e.target.value)}
                  rows={2}
                  placeholder={`Paragraph ${i + 1}`}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-icon"
                  onClick={() => removeCrescendoParagraph(i)}
                  aria-label="Remove paragraph"
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="btn" onClick={addCrescendoParagraph}>
              + Add paragraph
            </button>
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="crescendoBookTitle">Book title</label>
          <input
            id="crescendoBookTitle"
            value={meta.crescendoBookTitle ?? ''}
            onChange={(e) => update({ crescendoBookTitle: e.target.value || undefined })}
            placeholder={DEFAULT_CRESCENDO_BOOK_TITLE}
          />
        </div>
        <div className="form-row">
          <label htmlFor="crescendoBookSubtitle">Book subtitle</label>
          <input
            id="crescendoBookSubtitle"
            value={meta.crescendoBookSubtitle ?? ''}
            onChange={(e) => update({ crescendoBookSubtitle: e.target.value || undefined })}
            placeholder={DEFAULT_CRESCENDO_BOOK_SUBTITLE}
          />
        </div>
        <div className="form-row">
          <label htmlFor="crescendoPrimaryCtaLabel">Primary button label</label>
          <input
            id="crescendoPrimaryCtaLabel"
            value={meta.crescendoPrimaryCtaLabel ?? ''}
            onChange={(e) => update({ crescendoPrimaryCtaLabel: e.target.value || undefined })}
            placeholder={DEFAULT_CRESCENDO_PRIMARY_CTA_LABEL}
          />
        </div>
        <div className="form-row">
          <label htmlFor="crescendoPrimaryCtaHref">Primary button link</label>
          <input
            id="crescendoPrimaryCtaHref"
            type="url"
            value={meta.crescendoPrimaryCtaHref ?? ''}
            onChange={(e) => update({ crescendoPrimaryCtaHref: e.target.value || undefined })}
            placeholder={DEFAULT_CRESCENDO_PRIMARY_CTA_HREF}
          />
        </div>
        <div className="form-row form-row-check">
          <label htmlFor="crescendoPrimaryCtaNewTab">
            <input
              id="crescendoPrimaryCtaNewTab"
              type="checkbox"
              checked={meta.crescendoPrimaryCtaNewTab ?? true}
              onChange={(e) => update({ crescendoPrimaryCtaNewTab: e.target.checked })}
            />
            Open primary link in new tab
          </label>
        </div>
        <div className="form-row">
          <label htmlFor="crescendoSecondaryCtaLabel">Secondary button label</label>
          <input
            id="crescendoSecondaryCtaLabel"
            value={meta.crescendoSecondaryCtaLabel ?? ''}
            onChange={(e) => update({ crescendoSecondaryCtaLabel: e.target.value || undefined })}
            placeholder={DEFAULT_CRESCENDO_SECONDARY_CTA_LABEL}
          />
        </div>
        <div className="form-row">
          <label htmlFor="crescendoSecondaryCtaHref">Secondary button link</label>
          <input
            id="crescendoSecondaryCtaHref"
            type="url"
            value={meta.crescendoSecondaryCtaHref ?? ''}
            onChange={(e) => update({ crescendoSecondaryCtaHref: e.target.value || undefined })}
            placeholder={DEFAULT_CRESCENDO_SECONDARY_CTA_HREF}
          />
        </div>
        <div className="form-row form-row-check">
          <label htmlFor="crescendoSecondaryCtaNewTab">
            <input
              id="crescendoSecondaryCtaNewTab"
              type="checkbox"
              checked={meta.crescendoSecondaryCtaNewTab ?? true}
              onChange={(e) => update({ crescendoSecondaryCtaNewTab: e.target.checked })}
            />
            Open secondary link in new tab
          </label>
        </div>
      </div>
    </section>
  );
}
