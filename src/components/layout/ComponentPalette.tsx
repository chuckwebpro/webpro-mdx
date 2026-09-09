import { COMPONENT_CATALOG, type ComponentId } from '../../lib/components';
import { useComponentDrag } from '../../lib/component-drag';

interface Props {
  disabled?: boolean;
  onInsert?: (id: ComponentId) => void;
}

export function ComponentPalette({ disabled, onInsert }: Props) {
  const { startDrag } = useComponentDrag();
  const groups = ['Callouts', 'Media', 'Lists', 'Other'] as const;

  return (
    <div className="component-palette">
      <div className="component-palette-header">
        <h2>Components</h2>
        <p>Drag into the article body</p>
      </div>

      {groups.map((group) => {
        const items = COMPONENT_CATALOG.filter((c) => c.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="component-group">
            <h3>{group}</h3>
            <ul className="component-list">
              {items.map((item) => (
                <li key={item.id}>
                  <div
                    className={`component-chip${disabled ? ' disabled' : ''}`}
                    onPointerDown={(e) => {
                      if (disabled) return;
                      startDrag(item.id, item.label, e);
                    }}
                    onDoubleClick={() => !disabled && onInsert?.(item.id)}
                    title={
                      disabled
                        ? 'Select an article first'
                        : `${item.description}. Drag or double-click to insert.`
                    }
                    aria-label={`Drag ${item.label} into article`}
                  >
                    <span className="component-chip-grip" aria-hidden="true">
                      ⠿
                    </span>
                    <span className="component-chip-label">{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
