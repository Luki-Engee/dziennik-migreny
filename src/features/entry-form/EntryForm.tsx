import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { storage } from '../../lib/storage';
import { useOptions, addOptionFactory } from '../../lib/useOptions';
import { todayISO } from '../../lib/dates';
import type { Duration, Entry, Intensity, Medication } from '../../types';
import DatePickerField from '../../components/DatePickerField';
import CollapsibleSection from '../../components/CollapsibleSection';
import ChipGroup from '../../components/ChipGroup';
import IntensityPicker from './IntensityPicker';
import DurationPicker from './DurationPicker';
import TimePicker from './TimePicker';
import MedsEditor from './MedsEditor';

type DraftEntry = Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'intensity'> & { intensity: Intensity | null };

function emptyDraft(date: string): DraftEntry {
  return {
    date,
    startTime: undefined,
    duration: undefined,
    intensity: null,
    locations: [],
    painType: [],
    aura: false,
    auraSymptoms: [],
    symptoms: [],
    triggers: [],
    weather: [],
    food: [],
    meds: [],
    reliefs: [],
    menstruation: false,
    notes: '',
  };
}

export default function EntryForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'nowy';

  const existing = useLiveQuery(() => (isNew ? undefined : db.entries.get(id!)), [id, isNew]);
  const allEntries = useLiveQuery(() => db.entries.orderBy('updatedAt').reverse().toArray(), []);
  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    (allEntries ?? []).forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return map;
  }, [allEntries]);

  const [draft, setDraft] = useState<DraftEntry>(() => emptyDraft(params.get('data') ?? todayISO()));
  const [loadedExisting, setLoadedExisting] = useState(false);

  useEffect(() => {
    if (existing && !loadedExisting) {
      setDraft(existing);
      setLoadedExisting(true);
    }
  }, [existing, loadedExisting]);

  const locations = useOptions('locations');
  const painType = useOptions('painType');
  const auraSymptoms = useOptions('auraSymptoms');
  const symptoms = useOptions('symptoms');
  const triggers = useOptions('triggers');
  const weather = useOptions('weather');
  const food = useOptions('food');
  const reliefs = useOptions('reliefs');
  const medNames = useOptions('medNames');

  function patch(p: Partial<DraftEntry>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function copyFromPrevious() {
    const prev = (allEntries ?? []).find((e) => e.id !== id);
    if (!prev) return;
    setDraft((d) => ({
      ...d,
      locations: prev.locations,
      painType: prev.painType,
      aura: prev.aura,
      auraSymptoms: prev.auraSymptoms,
      symptoms: prev.symptoms,
      triggers: prev.triggers,
      weather: prev.weather,
      food: prev.food,
      reliefs: prev.reliefs,
      duration: prev.duration,
    }));
  }

  const canSave = draft.date && draft.intensity !== null;

  async function handleSave() {
    if (!canSave) return;
    const saved = await storage.saveEntry({
      ...draft,
      intensity: draft.intensity as Intensity,
      id: isNew ? undefined : id,
    });
    await storage.bumpUsage('locations', saved.locations);
    await storage.bumpUsage('painType', saved.painType);
    await storage.bumpUsage('triggers', saved.triggers);
    await storage.bumpUsage('weather', saved.weather);
    await storage.bumpUsage('food', saved.food);
    await storage.bumpUsage('reliefs', saved.reliefs);
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-xl hover:bg-stone-100 dark:hover:bg-stone-700" aria-label="Wstecz">
          ←
        </button>
        <h1 className="text-lg font-bold">{isNew ? 'Nowy wpis' : 'Edycja wpisu'}</h1>
      </header>

      <div className="mb-3">
        <button type="button" className="text-sm text-brand-600 underline dark:text-brand-400" onClick={copyFromPrevious}>
          Skopiuj z poprzedniego wpisu
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <CollapsibleSection title="Kiedy" defaultOpen>
          <div className="flex flex-col gap-3">
            <DatePickerField value={draft.date} onChange={(v) => patch({ date: v })} entriesByDate={entriesByDate} />
            <div>
              <label className="mb-1 block text-xs text-stone-500">Godzina rozpoczęcia</label>
              <TimePicker value={draft.startTime} onChange={(v) => patch({ startTime: v })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Czas trwania</label>
              <DurationPicker value={draft.duration as Duration | undefined} onChange={(v) => patch({ duration: v })} />
            </div>
          </div>
        </CollapsibleSection>

        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Siła bólu *</h2>
          <IntensityPicker value={draft.intensity} onChange={(v) => patch({ intensity: v })} />
        </div>

        <CollapsibleSection title="Lokalizacja bólu">
          <ChipGroup options={locations} selectedIds={draft.locations} onChange={(v) => patch({ locations: v })} onAddOption={addOptionFactory('locations')} />
        </CollapsibleSection>

        <CollapsibleSection title="Charakter bólu">
          <ChipGroup options={painType} selectedIds={draft.painType} onChange={(v) => patch({ painType: v })} onAddOption={addOptionFactory('painType')} />
        </CollapsibleSection>

        <CollapsibleSection title="Aura">
          <div className="mb-3 flex gap-2">
            <button type="button" className="chip" data-selected={draft.aura} onClick={() => patch({ aura: true })}>
              Tak
            </button>
            <button type="button" className="chip" data-selected={!draft.aura} onClick={() => patch({ aura: false, auraSymptoms: [] })}>
              Nie
            </button>
          </div>
          {draft.aura && (
            <ChipGroup options={auraSymptoms} selectedIds={draft.auraSymptoms} onChange={(v) => patch({ auraSymptoms: v })} onAddOption={addOptionFactory('auraSymptoms')} />
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Objawy towarzyszące">
          <ChipGroup options={symptoms} selectedIds={draft.symptoms} onChange={(v) => patch({ symptoms: v })} onAddOption={addOptionFactory('symptoms')} />
        </CollapsibleSection>

        <CollapsibleSection title="Możliwe przyczyny / wyzwalacze">
          <ChipGroup options={triggers} selectedIds={draft.triggers} onChange={(v) => patch({ triggers: v })} onAddOption={addOptionFactory('triggers')} />
        </CollapsibleSection>

        <CollapsibleSection title="Pogoda">
          <ChipGroup options={weather} selectedIds={draft.weather} onChange={(v) => patch({ weather: v })} onAddOption={addOptionFactory('weather')} />
        </CollapsibleSection>

        <CollapsibleSection title="Jedzenie i picie">
          <ChipGroup options={food} selectedIds={draft.food} onChange={(v) => patch({ food: v })} onAddOption={addOptionFactory('food')} />
        </CollapsibleSection>

        <CollapsibleSection title="Leki">
          <MedsEditor meds={draft.meds} onChange={(v) => patch({ meds: v })} medOptions={medNames} onAddOption={addOptionFactory('medNames')} />
        </CollapsibleSection>

        <CollapsibleSection title="Co jeszcze pomogło">
          <ChipGroup options={reliefs} selectedIds={draft.reliefs} onChange={(v) => patch({ reliefs: v })} onAddOption={addOptionFactory('reliefs')} />
        </CollapsibleSection>

        <div className="card flex items-center justify-between p-4">
          <span className="font-semibold">Miesiączka tego dnia</span>
          <div className="flex gap-2">
            <button type="button" className="chip" data-selected={draft.menstruation === true} onClick={() => patch({ menstruation: true })}>
              Tak
            </button>
            <button type="button" className="chip" data-selected={!draft.menstruation} onClick={() => patch({ menstruation: false })}>
              Nie
            </button>
          </div>
        </div>

        <CollapsibleSection title="Notatki">
          <textarea
            value={draft.notes ?? ''}
            onChange={(e) => patch({ notes: e.target.value })}
            rows={4}
            className="w-full rounded-xl2 border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-800"
            placeholder="Dowolne uwagi..."
          />
        </CollapsibleSection>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-stone-200 bg-white/95 p-3 backdrop-blur dark:border-stone-700 dark:bg-stone-800/95">
        <div className="mx-auto flex max-w-md gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>
            Anuluj
          </button>
          <button type="button" className="btn-primary flex-1 disabled:opacity-40" disabled={!canSave} onClick={handleSave}>
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}
