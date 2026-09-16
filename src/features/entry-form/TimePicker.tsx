import { useMemo } from 'react';

interface Props {
  value?: string;
  onChange: (v: string) => void;
}

function buildTimes(): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return times;
}

export default function TimePicker({ value, onChange }: Props) {
  const times = useMemo(buildTimes, []);

  function now() {
    const d = new Date();
    const rounded = Math.round(d.getMinutes() / 15) * 15;
    const h = rounded === 60 ? (d.getHours() + 1) % 24 : d.getHours();
    const m = rounded === 60 ? 0 : rounded;
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  return (
    <div className="flex gap-2">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-touch flex-1 rounded-xl2 border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-800"
      >
        <option value="" disabled>
          Wybierz godzinę
        </option>
        {times.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button type="button" className="btn-secondary" onClick={now}>
        Teraz
      </button>
    </div>
  );
}
