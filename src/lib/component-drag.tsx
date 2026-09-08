import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ComponentId } from './components';

interface DragState {
  id: ComponentId;
  label: string;
  x: number;
  y: number;
}

interface ComponentDragContextValue {
  drag: DragState | null;
  dropTargetActive: boolean;
  startDrag: (id: ComponentId, label: string, e: React.PointerEvent) => void;
  registerDropZone: (el: HTMLElement | null) => void;
}

const ComponentDragContext = createContext<ComponentDragContextValue | null>(null);

function hitRect(x: number, y: number, el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

interface ProviderProps {
  children: ReactNode;
  onDrop: (id: ComponentId) => void;
}

export function ComponentDragProvider({ children, onDrop }: ProviderProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTargetActive, setDropTargetActive] = useState(false);
  const dropZoneRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const registerDropZone = useCallback((el: HTMLElement | null) => {
    dropZoneRef.current = el;
  }, []);

  const startDrag = useCallback((id: ComponentId, label: string, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const state: DragState = { id, label, x: e.clientX, y: e.clientY };
    dragRef.current = state;
    setDrag(state);
    document.body.classList.add('component-drag-active');
  }, []);

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;

      const next = { ...current, x: e.clientX, y: e.clientY };
      dragRef.current = next;
      setDrag(next);

      const zone = dropZoneRef.current;
      setDropTargetActive(zone ? hitRect(e.clientX, e.clientY, zone) : false);
    };

    const endDrag = (e: PointerEvent) => {
      const current = dragRef.current;
      const zone = dropZoneRef.current;

      if (current && zone && hitRect(e.clientX, e.clientY, zone)) {
        onDropRef.current(current.id);
      }

      dragRef.current = null;
      setDrag(null);
      setDropTargetActive(false);
      document.body.classList.remove('component-drag-active');
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      document.body.classList.remove('component-drag-active');
    };
  }, [drag]);

  return (
    <ComponentDragContext.Provider
      value={{ drag, dropTargetActive, startDrag, registerDropZone }}
    >
      {children}
      {drag && (
        <div
          className="component-drag-ghost"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          {drag.label}
        </div>
      )}
    </ComponentDragContext.Provider>
  );
}

export function useComponentDrag(): ComponentDragContextValue {
  const ctx = useContext(ComponentDragContext);
  if (!ctx) {
    throw new Error('useComponentDrag must be used within ComponentDragProvider');
  }
  return ctx;
}
