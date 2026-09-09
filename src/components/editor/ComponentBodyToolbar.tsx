import {
  applyFormat$,
  applyListType$,
  currentFormat$,
  currentListType$,
  IS_BOLD,
  IS_ITALIC,
  IS_UNDERLINE,
} from '@mdxeditor/editor';
import { useCellValues, usePublisher } from '@mdxeditor/gurx';

function FormatButton({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      className={`jsx-body-tool-btn${active ? ' active' : ''}`}
      onClick={onClick}
      title={title}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function ComponentBodyToolbar() {
  const applyFormat = usePublisher(applyFormat$);
  const applyListType = usePublisher(applyListType$);
  const [currentFormat, currentListType] = useCellValues(currentFormat$, currentListType$);

  return (
    <div className="jsx-body-toolbar">
      <FormatButton
        label="B"
        title="Bold (Ctrl+B)"
        active={(currentFormat & IS_BOLD) !== 0}
        onClick={() => applyFormat('bold')}
      />
      <FormatButton
        label="I"
        title="Italic (Ctrl+I)"
        active={(currentFormat & IS_ITALIC) !== 0}
        onClick={() => applyFormat('italic')}
      />
      <FormatButton
        label="U"
        title="Underline (Ctrl+U)"
        active={(currentFormat & IS_UNDERLINE) !== 0}
        onClick={() => applyFormat('underline')}
      />
      <span className="jsx-body-tool-sep" aria-hidden="true" />
      <FormatButton
        label="•"
        title="Bulleted list"
        active={currentListType === 'bullet'}
        onClick={() => applyListType(currentListType === 'bullet' ? '' : 'bullet')}
      />
      <FormatButton
        label="1."
        title="Numbered list"
        active={currentListType === 'number'}
        onClick={() => applyListType(currentListType === 'number' ? '' : 'number')}
      />
    </div>
  );
}
