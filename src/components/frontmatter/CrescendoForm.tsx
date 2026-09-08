import type { DraftMeta } from '../../lib/types';

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
      </div>
    </section>
  );
}
