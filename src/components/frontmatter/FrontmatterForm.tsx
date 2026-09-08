import { useState, type ReactNode } from 'react';
import type { DraftMeta } from '../../lib/types';
import { CATEGORIES } from '../../lib/types';
import { slugify, todayIsoDate } from '../../lib/utils';

interface Props {
  meta: DraftMeta;
  onChange: (meta: DraftMeta) => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="form-section">
      <h3 className="form-section-title">{title}</h3>
      <div className="form-section-body">{children}</div>
    </section>
  );
}

export function FrontmatterForm({ meta, onChange }: Props) {
  const [tagInput, setTagInput] = useState('');

  const update = (patch: Partial<DraftMeta>) => {
    onChange({ ...meta, ...patch });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || meta.tags.includes(tag)) return;
    update({ tags: [...meta.tags, tag] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    update({ tags: meta.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="frontmatter-form">
      <Section title="1. Title & URL">
        <div className="form-row">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            value={meta.title}
            onChange={(e) => {
              const title = e.target.value;
              update({ title, slug: meta.slug || slugify(title) });
            }}
            placeholder='Wolf. Wolf. Wolf. — or use <span class="accent">word</span>'
          />
        </div>
        <div className="form-row">
          <label htmlFor="slug">Slug (filename)</label>
          <input
            id="slug"
            value={meta.slug}
            onChange={(e) => update({ slug: slugify(e.target.value) })}
          />
        </div>
        <div className="form-row">
          <label htmlFor="eyebrow">Eyebrow</label>
          <input
            id="eyebrow"
            value={meta.eyebrow ?? ''}
            onChange={(e) => update({ eyebrow: e.target.value || undefined })}
            placeholder="A WEBPRO White Paper"
          />
        </div>
      </Section>

      <Section title="2. Hero">
        <div className="form-row">
          <label htmlFor="dek">Subtitle *</label>
          <textarea
            id="dek"
            rows={3}
            value={meta.dek}
            onChange={(e) => update({ dek: e.target.value })}
            placeholder="One- or two-sentence summary in italics beneath the headline."
          />
        </div>
        <div className="form-row">
          <label htmlFor="byline">Byline</label>
          <input
            id="byline"
            value={meta.byline ?? ''}
            onChange={(e) => update({ byline: e.target.value || undefined })}
            placeholder="WEBPRO International Inc. / 31 Years in Organic Search / Savannah, GA"
          />
        </div>
        <div className="form-row">
          <label htmlFor="author">Author</label>
          <input
            id="author"
            value={meta.author}
            onChange={(e) => update({ author: e.target.value })}
          />
        </div>
      </Section>

      <Section title="3. Publishing">
        <div className="form-row">
          <label htmlFor="publishDate">Publish date *</label>
          <input
            id="publishDate"
            type="date"
            value={meta.publishDate || todayIsoDate()}
            onChange={(e) => update({ publishDate: e.target.value })}
          />
        </div>
        <div className="form-row">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={meta.category ?? ''}
            onChange={(e) => update({ category: e.target.value || undefined })}
          >
            <option value="">— Select —</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="updatedDate">Updated date</label>
          <input
            id="updatedDate"
            type="date"
            value={meta.updatedDate ?? ''}
            onChange={(e) => update({ updatedDate: e.target.value || undefined })}
          />
        </div>
        <div className="form-row form-row-check">
          <label>
            <input
              type="checkbox"
              checked={meta.draft}
              onChange={(e) => update({ draft: e.target.checked })}
            />
            Draft — hidden in production build
          </label>
        </div>
        <div className="form-row">
          <label>Tags</label>
          <div className="tag-input-row">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag, press Enter"
            />
            <button type="button" className="btn" onClick={addTag}>
              Add
            </button>
          </div>
          {meta.tags.length > 0 && (
            <div className="tag-list">
              {meta.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="4. SEO">
        <div className="form-row">
          <label htmlFor="description">Meta description</label>
          <textarea
            id="description"
            rows={2}
            value={meta.description ?? ''}
            onChange={(e) => update({ description: e.target.value || undefined })}
            placeholder="150–160 characters for search snippets (optional)"
          />
        </div>
      </Section>
    </div>
  );
}
