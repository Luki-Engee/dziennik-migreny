interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button type="button" className="chip" data-selected={selected} onClick={onClick} aria-pressed={selected}>
      {label}
    </button>
  );
}
