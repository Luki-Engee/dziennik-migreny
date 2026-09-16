import type { Intensity } from '../../types';
import { painBand, painLabel } from '../../types';

const bandStyles: Record<'low' | 'mid' | 'high', string> = {
  low: 'bg-pain-low/15 border-pain-low text-pain-low data-[selected=true]:bg-pain-low data-[selected=true]:text-white',
  mid: 'bg-pain-mid/15 border-pain-mid text-amber-700 dark:text-amber-300 data-[selected=true]:bg-pain-mid data-[selected=true]:text-white',
  high: 'bg-pain-high/15 border-pain-high text-pain-high data-[selected=true]:bg-pain-high data-[selected=true]:text-white',
};

interface Props {
  value: Intensity | null;
  onChange: (v: Intensity) => void;
}

export default function IntensityPicker({ value, onChange }: Props) {
  const row1 = [1, 2, 3, 4, 5] as Intensity[];
  const row2 = [6, 7, 8, 9, 10] as Intensity[];

  const renderRow = (row: Intensity[]) => (
    <div className="grid grid-cols-5 gap-2">
      {row.map((n) => (
        <button
          key={n}
          type="button"
          data-selected={value === n}
          onClick={() => onChange(n)}
          className={`min-h-touch rounded-xl2 border-2 text-lg font-bold ${bandStyles[painBand(n)]}`}
          aria-pressed={value === n}
        >
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-2 flex flex-col gap-2">
        {renderRow(row1)}
        {renderRow(row2)}
      </div>
      <p className="text-center text-sm font-medium text-stone-600 dark:text-stone-300">
        {value ? painLabel(value) : 'Wybierz siłę bólu'}
      </p>
    </div>
  );
}
