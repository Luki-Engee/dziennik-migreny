import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { toISODate } from '../lib/dates';
import type { Entry } from '../types';
import { painBand } from '../types';

const WEEKDAYS_PL = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'nie'];

const bandBg: Record<'low' | 'mid' | 'high', string> = {
  low: 'bg-pain-low/20 text-pain-low',
  mid: 'bg-pain-mid/25 text-amber-700 dark:text-amber-300',
  high: 'bg-pain-high/20 text-pain-high',
};
const bandDot: Record<'low' | 'mid' | 'high', string> = {
  low: 'bg-pain-low',
  mid: 'bg-pain-mid',
  high: 'bg-pain-high',
};

interface MonthGridProps {
  month: Date;
  selectedDate?: string;
  entriesByDate: Map<string, Entry[]>;
  onSelectDate: (isoDate: string) => void;
  disableFuture?: boolean;
}

export default function MonthGrid({ month, selectedDate, entriesByDate, onSelectDate, disableFuture }: MonthGridProps) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1, locale: pl });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1, locale: pl });
  const days = eachDayOfInterval({ start, end });
  const today = new Date();

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-stone-400">
        {WEEKDAYS_PL.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = toISODate(day);
          const dayEntries = entriesByDate.get(iso) ?? [];
          const maxIntensity = dayEntries.reduce((m, e) => Math.max(m, e.intensity), 0);
          const hasMed = dayEntries.some((e) => e.meds.length > 0);
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate === iso;
          const future = disableFuture && isAfter(day, today) && !isSameDay(day, today);

          return (
            <button
              key={iso}
              type="button"
              disabled={future}
              onClick={() => onSelectDate(iso)}
              className={[
                'relative flex aspect-square min-h-touch flex-col items-center justify-center rounded-lg text-sm',
                inMonth ? '' : 'opacity-40',
                isSelected ? 'ring-2 ring-brand-500' : '',
                isToday ? 'font-bold' : '',
                dayEntries.length > 0 ? bandBg[painBand(maxIntensity as any)] : 'hover:bg-stone-100 dark:hover:bg-stone-700',
                future ? 'cursor-not-allowed opacity-30' : '',
              ].join(' ')}
              aria-label={iso}
            >
              <span>{day.getDate()}</span>
              {dayEntries.length > 0 && (
                <span className={`absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] text-white ${bandDot[painBand(maxIntensity as any)]}`}>
                  {maxIntensity}
                </span>
              )}
              {hasMed && <span className="absolute bottom-0.5 text-[10px]" aria-label="lek przyjęty">💊</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
