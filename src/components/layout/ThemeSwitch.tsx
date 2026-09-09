import type { Theme } from '../../lib/theme';

interface Props {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeSwitch({ theme, onChange }: Props) {
  const isLight = theme === 'light';

  return (
    <label className="theme-switch" title="Editor appearance">
      <span className={`theme-switch-label${isLight ? '' : ' active'}`}>Dark</span>
      <span className="theme-switch-track">
        <input
          type="checkbox"
          className="theme-switch-input"
          checked={isLight}
          onChange={(e) => onChange(e.target.checked ? 'light' : 'dark')}
          aria-label="Toggle light mode"
        />
        <span className="theme-switch-thumb" aria-hidden="true" />
      </span>
      <span className={`theme-switch-label${isLight ? ' active' : ''}`}>Light</span>
    </label>
  );
}
