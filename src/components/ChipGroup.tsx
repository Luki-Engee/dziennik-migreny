import { useState } from 'react';
import type { OptionItem } from '../types';
import Chip from './Chip';

interface ChipGroupProps {
  options: OptionItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onAddOption: (label: string) => Promise<OptionItem>;
}

export default function ChipGroup({ options, selectedIds, onChange, onAddOption }: ChipGroupProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const visible = options.filter((o) => !o.hidden || selectedIds.includes(o.id));

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  async function submitNew() {
    const label = newLabel.trim();
    if (!label) {
      setAdding(false);
      return;
    }
    const item = await onAddOption(label);
    onChange([...selectedIds, item.id]);
    setNewLabel('');
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((o) => (
        <Chip key={o.id} label={o.label} selected={selectedIds.includes(o.id)} onClick={() => toggle(o.id)} />
      ))}
      {adding ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            submitNew();
          }}
        >
          <input
            autoFocus
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onBlur={submitNew}
            placeholder="Nowa opcja"
            className="min-h-touch rounded-full border border-stone-300 px-3 py-1 text-sm dark:border-stone-600 dark:bg-stone-800"
          />
        </form>
      ) : (
        <button type="button" className="chip" onClick={() => setAdding(true)}>
          + Inne
        </button>
      )}
    </div>
  );
}
