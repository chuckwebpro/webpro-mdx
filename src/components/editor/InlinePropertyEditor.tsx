import { useEffect, useState } from 'react';

interface Props {
  properties: Record<string, string>;
  title: string;
  onChange: (values: Record<string, string>) => void;
}

export function InlinePropertyEditor({ properties, title, onChange }: Props) {
  const [local, setLocal] = useState(properties);
  const propNames = Object.keys(properties);

  useEffect(() => {
    setLocal(properties);
  }, [properties]);

  if (propNames.length === 0) return null;

  const handleChange = (name: string, value: string) => {
    setLocal((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = () => {
    onChange(local);
  };

  return (
    <div className="jsx-inline-props">
      <div className="jsx-inline-props-title">{title}</div>
      <div className="jsx-inline-props-grid">
        {propNames.map((name) => (
          <label key={name} className="jsx-inline-prop">
            <span className="jsx-inline-prop-label">{name}</span>
            <input
              className="jsx-inline-prop-input"
              value={local[name] ?? ''}
              onChange={(e) => handleChange(name, e.target.value)}
              onBlur={handleBlur}
              placeholder={name}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
