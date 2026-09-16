import { useMemo, useState } from 'react';
import { addMonths, subMonths } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';
import MonthGrid from '../../components/MonthGrid';
import { formatMonthPl, todayISO } from '../../lib/dates';
import DayDetailsSheet from './DayDetailsSheet';

export default function CalendarView() {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const navigate = useNavigate();

  const entries = useLiveQuery(() => db.entries.toArray(), []);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, typeof entries>();
    (entries ?? []).forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr as any);
    });
    return map as Map<string, NonNullable<typeof entries>>;
  }, [entries]);

  function handleSelectDate(iso: string) {
    const hasEntries = (entriesByDate.get(iso)?.length ?? 0) > 0;
    if (hasEntries) {
      setSelectedDate(iso);
    } else {
      navigate(`/wpis/nowy?data=${iso}`);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Poprzedni miesiąc"
          className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-xl hover:bg-stone-100 dark:hover:bg-stone-700"
          onClick={() => setMonth((m) => subMonths(m, 1))}
        >
          ←
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold capitalize">{formatMonthPl(month)}</h1>
          <button type="button" className="text-xs text-brand-600 underline dark:text-brand-400" onClick={() => setMonth(new Date())}>
            Dziś
          </button>
        </div>
        <button
          type="button"
          aria-label="Następny miesiąc"
          className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-xl hover:bg-stone-100 dark:hover:bg-stone-700"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          →
        </button>
      </header>

      <div className="card p-3">
        <MonthGrid month={month} entriesByDate={entriesByDate} onSelectDate={handleSelectDate} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-pain-low" /> 1–3 łagodny</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-pain-mid" /> 4–6 umiarkowany</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-pain-high" /> 7–10 silny</span>
        <span className="flex items-center gap-1">💊 lek przyjęty</span>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/wpis/nowy?data=${todayISO()}`)}
        className="btn-primary fixed bottom-20 right-4 z-20 rounded-full px-5 py-4 shadow-lg"
      >
        + Dodaj ból głowy
      </button>

      {selectedDate && (
        <DayDetailsSheet
          date={selectedDate}
          entries={entriesByDate.get(selectedDate) ?? []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
