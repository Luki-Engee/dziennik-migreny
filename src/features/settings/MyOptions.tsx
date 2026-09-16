import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOptions } from '../../lib/useOptions';
import { storage } from '../../lib/storage';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../../lib/categoryLabels';
import type { OptionCategory } from '../../types';

export default function MyOptions() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();

  if (!category) {
    return (
      <div className="mx-auto max-w-md px-4 pb-28 pt-4">
        <Header title="Moje opcje" onBack={() => navigate('/ustawienia')} />
        <div className="flex flex-col gap-2">
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              className="card flex min-h-touch items-center justify-between px-4 py-3 text-left"
              onClick={() => navigate(`/ustawienia/moje-opcje/${c}`)}
            >
              <span>{CATEGORY_LABELS[c]}</span>
              <span aria-hidden>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <CategoryEditor category={category as OptionCategory} onBack={() => navigate('/ustawienia/moje-opcje')} />;
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <button type="button" onClick={onBack} className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-xl hover:bg-stone-100 dark:hover:bg-stone-700" aria-label="Wstecz">
        ←
      </button>
      <h1 className="text-lg font-bold">{title}</h1>
    </header>
  );
}

function CategoryEditor({ category, onBack }: { category: OptionCategory; onBack: () => void }) {
  const options = useOptions(category);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newLabel, setNewLabel] = useState('');

  async function rename(id: string) {
    const item = options.find((o) => o.id === id);
    if (!item || !editValue.trim()) {
      setEditingId(null);
      return;
    }
    await storage.updateOption(category, { ...item, label: editValue.trim() });
    setEditingId(null);
  }

  async function toggleHidden(id: string) {
    const item = options.find((o) => o.id === id);
    if (!item) return;
    await storage.updateOption(category, { ...item, hidden: !item.hidden });
  }

  async function move(id: string, dir: -1 | 1) {
    const sorted = [...options].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((o) => o.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await storage.updateOption(category, { ...a, order: b.order });
    await storage.updateOption(category, { ...b, order: a.order });
  }

  async function addOption() {
    const label = newLabel.trim();
    if (!label) return;
    await storage.addOption(category, label);
    setNewLabel('');
  }

  const sorted = [...options].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <Header title={CATEGORY_LABELS[category]} onBack={onBack} />
      <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
        Usunięcie lub ukrycie opcji nie wpływa na już zapisane wpisy.
      </p>
      <div className="flex flex-col gap-2">
        {sorted.map((o, i) => (
          <div key={o.id} className="card flex items-center gap-2 p-3">
            <div className="flex flex-col">
              <button type="button" disabled={i === 0} className="text-sm disabled:opacity-20" onClick={() => move(o.id, -1)} aria-label="Przesuń w górę">
                ▲
              </button>
              <button type="button" disabled={i === sorted.length - 1} className="text-sm disabled:opacity-20" onClick={() => move(o.id, 1)} aria-label="Przesuń w dół">
                ▼
              </button>
            </div>
            <div className="flex-1">
              {editingId === o.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => rename(o.id)}
                  className="min-h-touch w-full rounded-lg border border-stone-300 px-2 py-1 dark:border-stone-600 dark:bg-stone-800"
                />
              ) : (
                <span className={o.hidden ? 'text-stone-400 line-through' : ''}>{o.label}</span>
              )}
              <span className="ml-2 text-xs text-stone-400">({o.usageCount}×)</span>
            </div>
            <button
              type="button"
              className="min-h-touch min-w-touch text-sm text-brand-600 dark:text-brand-400"
              onClick={() => {
                setEditingId(o.id);
                setEditValue(o.label);
              }}
            >
              Edytuj
            </button>
            <button type="button" className="min-h-touch min-w-touch text-sm" onClick={() => toggleHidden(o.id)}>
              {o.hidden ? 'Pokaż' : 'Ukryj'}
            </button>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addOption();
        }}
      >
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nowa opcja"
          className="min-h-touch flex-1 rounded-xl2 border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-800"
        />
        <button type="submit" className="btn-primary">Dodaj</button>
      </form>
    </div>
  );
}
