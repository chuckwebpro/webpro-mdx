import { useCallback, useEffect, useRef } from 'react';

interface Props {
  onResize: (deltaX: number) => void;
  onResizeEnd?: () => void;
}

export function ResizeDivider({ onResize, onResizeEnd }: Props) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);
  onResizeRef.current = onResize;
  onResizeEndRef.current = onResizeEnd;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onResizeRef.current(delta);
    };

    const endDrag = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.classList.remove('resize-dragging');
      onResizeEndRef.current?.();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      document.body.classList.remove('resize-dragging');
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging.current = true;
    lastX.current = e.clientX;
    document.body.classList.add('resize-dragging');
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  return (
    <div
      className="resize-divider"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize editor and preview panels"
      onPointerDown={handlePointerDown}
    />
  );
}
