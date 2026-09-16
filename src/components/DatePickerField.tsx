import { useMemo, useState } from 'react';
import { addMonths, subMonths } from 'date-fns';
import Modal from './Modal';
import MonthGrid from './MonthGrid';
import { fromISODate, formatLongPl, formatMonthPl, toISODate, todayISO } from '../lib/dates';
import type { Entry } from '../types';

interface DatePickerFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  entriesByDate: Map<string, Entry[]>;
}

export default function DatePickerField({ value, onChange, entriesByDate }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => fromISODate(value));

  const label = useMemo(() => formatLongPl(fromISODate(value)), [value]);

  function openPicker() {
    setVisibleMonth(fromISODate(value));
    setOpen(true);
  }

  function pick(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  function yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toISODate(d);
  }

  return (
    <div>
      <button
        type="button"
        onClick={openPicker}
        className="min-h-touch w-full rounded-xl2 border border-stone-300 bg-white px-4 py-3 text-left text-base dark:border-stone-600 dark:bg-stone-800"
      >
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Wybierz datę">
        <div className="mb-3 flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => pick(todayISO())}>
            Dziś
          </button>
          <button type="button" className="btn-secondary flex-1" onClick={() => pick(yesterday())}>
            Wczoraj
          </button>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Poprzedni miesiąc"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700"
            onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
          >
            ←
          </button>
          <span className="font-semibold capitalize">{formatMonthPl(visibleMonth)}</span>
          <button
            type="button"
            aria-label="Następny miesiąc"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700"
            onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          >
            →
          </button>
        </div>
        <MonthGrid
          month={visibleMonth}
          selectedDate={value}
          entriesByDate={entriesByDate}
          onSelectDate={pick}
          disableFuture
        />
      </Modal>
    </div>
  );
}
