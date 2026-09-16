import type { Duration } from '../../types';

const options: { value: Duration; label: string }[] = [
  { value: '<1h', label: '< 1 h' },
  { value: '1-4h', label: '1–4 h' },
  { value: '4-12h', label: '4–12 h' },
  { value: '12-24h', label: '12–24 h' },
  { value: '>24h', label: '> 24 h' },
  { value: 'trwa', label: 'Nadal trwa' },
];

interface Props {
  value?: Duration;
  onChange: (v: Duration) => void;
}

export default function DurationPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="chip"
          data-selected={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
