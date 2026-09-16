import { useState } from 'react';
import type { Medication, MedEffect, OptionItem } from '../../types';
import TimePicker from './TimePicker';

const effects: MedEffect[] = ['brak', 'trochę', 'pomógł', 'całkowicie'];

interface Props {
  meds: Medication[];
  onChange: (meds: Medication[]) => void;
  medOptions: OptionItem[];
  onAddOption: (label: string) => Promise<OptionItem>;
}

export default function MedsEditor({ meds, onChange, medOptions, onAddOption }: Props) {
  const [name, setName] = useState('');
  const [customOpen, setCustomOpen] = useState(false);

  function updateMed(i: number, patch: Partial<Medication>) {
    const next = meds.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  function removeMed(i: number) {
    onChange(meds.filter((_, idx) => idx !== i));
  }

  async function addMed(medName: string) {
    const trimmed = medName.trim();
    if (!trimmed) return;
    if (!medOptions.some((o) => o.label.toLowerCase() === trimmed.toLowerCase())) {
      await onAddOption(trimmed);
    }
    onChange([...meds, { name: trimmed }]);
    setName('');
    setCustomOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {meds.map((med, i) => (
        <div key={i} className="card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">{med.name}</span>
            <button type="button" onClick={() => removeMed(i)} className="text-sm text-red-600">
              Usuń
            </button>
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-xs text-stone-500">Dawka</label>
            <input
              value={med.dose ?? ''}
              onChange={(e) => updateMed(i, { dose: e.target.value })}
              placeholder="np. 400 mg"
              className="min-h-touch w-full rounded-xl2 border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-800"
            />
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-xs text-stone-500">Godzina</label>
            <TimePicker value={med.time} onChange={(t) => updateMed(i, { time: t })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Skuteczność</label>
            <div className="flex flex-wrap gap-2">
              {effects.map((eff) => (
                <button
                  key={eff}
                  type="button"
                  className="chip"
                  data-selected={med.effect === eff}
                  onClick={() => updateMed(i, { effect: eff })}
                >
                  {eff === 'brak' ? 'nie pomógł' : eff}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {medOptions
          .filter((o) => !o.hidden)
          .map((o) => (
            <button key={o.id} type="button" className="chip" onClick={() => addMed(o.label)}>
              + {o.label}
            </button>
          ))}
        {customOpen ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              addMed(name);
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => addMed(name)}
              placeholder="Nazwa leku"
              className="min-h-touch rounded-full border border-stone-300 px-3 py-1 text-sm dark:border-stone-600 dark:bg-stone-800"
            />
          </form>
        ) : (
          <button type="button" className="chip" onClick={() => setCustomOpen(true)}>
            + Inny lek
          </button>
        )}
      </div>
    </div>
  );
}
