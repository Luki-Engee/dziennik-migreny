import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import { db } from '../../lib/db';
import { useOptions } from '../../lib/useOptions';
import { formatShortPl } from '../../lib/dates';
import {
  avgDurationHours,
  avgIntensity,
  byTimeOfDay,
  byWeekday,
  daysWithMeds,
  daysWithPain,
  filterByRange,
  HIGH_MED_DAYS_THRESHOLD,
  medEffectiveness,
  menstruationStats,
  pressureByDay,
  rankOptions,
  type StatsRange,
} from '../../lib/stats';

const ranges: { value: StatsRange; label: string }[] = [
  { value: 'month', label: 'Miesiąc' },
  { value: '3m', label: '3 miesiące' },
  { value: 'year', label: 'Rok' },
];

function HorizontalRank({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  if (data.length === 0) return null;
  const top = data.slice(0, 8);
  return (
    <div className="card p-4">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(120, top.length * 34)}>
        <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 10.5 }} interval={0} />
          <Tooltip />
          <Bar dataKey="count" fill="#ea6a35" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function StatsView() {
  const [range, setRange] = useState<StatsRange>('month');
  const allEntries = useLiveQuery(() => db.entries.toArray(), []) ?? [];
  const triggers = useOptions('triggers');
  const weather = useOptions('weather');
  const food = useOptions('food');

  const entries = useMemo(() => filterByRange(allEntries, range), [allEntries, range]);

  const weekday = useMemo(() => byWeekday(entries), [entries]);
  const timeOfDay = useMemo(() => byTimeOfDay(entries), [entries]);
  const triggerRank = useMemo(() => rankOptions(entries, 'triggers', triggers), [entries, triggers]);
  const weatherRank = useMemo(() => rankOptions(entries, 'weather', weather), [entries, weather]);
  const foodRank = useMemo(() => rankOptions(entries, 'food', food), [entries, food]);
  const meds = useMemo(() => medEffectiveness(entries), [entries]);
  const mens = useMemo(() => menstruationStats(entries), [entries]);
  const pressure = useMemo(
    () => pressureByDay(entries).map((p) => ({ ...p, label: formatShortPl(p.date) })),
    [entries],
  );

  const medDays = daysWithMeds(entries);
  const highMedUsage = medDays >= HIGH_MED_DAYS_THRESHOLD;

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <h1 className="mb-4 text-lg font-bold">Statystyki</h1>

      <div className="mb-4 flex gap-2">
        {ranges.map((r) => (
          <button key={r.value} type="button" className="chip" data-selected={range === r.value} onClick={() => setRange(r.value)}>
            {r.label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">Brak wpisów w wybranym okresie.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{daysWithPain(entries)}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">dni z bólem</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{avgIntensity(entries).toFixed(1)}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">średnia siła bólu</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{avgDurationHours(entries).toFixed(1)} h</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">średni czas trwania</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{medDays}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">dni z lekami</div>
            </div>
          </div>

          {highMedUsage && (
            <div className="card border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              W tym okresie leki przeciwbólowe pojawiają się w {medDays} dniach – warto o tym wspomnieć lekarzowi przy najbliższej wizycie.
            </div>
          )}

          <HorizontalRank title="Najczęstsze wyzwalacze" data={triggerRank} />
          <HorizontalRank title="Pogoda" data={weatherRank} />
          <HorizontalRank title="Jedzenie i picie" data={foodRank} />

          <div className="card p-4">
            <h3 className="mb-2 font-semibold">Dni tygodnia</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekday}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ea6a35" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 font-semibold">Pora dnia</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={timeOfDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f0a93a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 font-semibold">Ciśnienie atmosferyczne a ból</h3>
            {pressure.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Brak danych pogodowych dla tego okresu. Ustaw miasto w Ustawieniach, aby przy nowych wpisach
                automatycznie zapisywać ciśnienie i zobaczyć tu trend.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={pressure} margin={{ left: -16, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" domain={[0, 10]} allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={['dataMin - 4', 'dataMax + 4']}
                    tick={{ fontSize: 11 }}
                    unit=" hPa"
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="intensity" name="Siła bólu" fill="#ea6a35" radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pressureHpa"
                    name="Ciśnienie (hPa)"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {meds.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-2 font-semibold">Skuteczność leków</h3>
              <div className="flex flex-col gap-2">
                {meds.map((m) => (
                  <div key={m.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-stone-500">{m.total}×</span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700">
                      {m.calkowicie > 0 && <div className="bg-pain-low" style={{ width: `${(m.calkowicie / m.total) * 100}%` }} />}
                      {m.pomogl > 0 && <div className="bg-brand-400" style={{ width: `${(m.pomogl / m.total) * 100}%` }} />}
                      {m.troche > 0 && <div className="bg-pain-mid" style={{ width: `${(m.troche / m.total) * 100}%` }} />}
                      {m.brak > 0 && <div className="bg-pain-high" style={{ width: `${(m.brak / m.total) * 100}%` }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <h3 className="mb-2 font-semibold">Cykl miesiączkowy</h3>
            <p className="text-sm">
              {mens.onPeriodPct.toFixed(0)}% epizodów w dni miesiączki, {mens.beforePeriodPct.toFixed(0)}% w ciągu 3 dni przed nią.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
