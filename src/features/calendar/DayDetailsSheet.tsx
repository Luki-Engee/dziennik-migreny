import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import { fromISODate, formatLongPl } from '../../lib/dates';
import { storage } from '../../lib/storage';
import type { Entry } from '../../types';
import { painBand, painLabel } from '../../types';
import { useState } from 'react';

interface Props {
  date: string;
  entries: Entry[];
  onClose: () => void;
}

const bandText: Record<'low' | 'mid' | 'high', string> = {
  low: 'text-pain-low',
  mid: 'text-amber-600 dark:text-amber-400',
  high: 'text-pain-high',
};

export default function DayDetailsSheet({ date, entries, onClose }: Props) {
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    await storage.deleteEntry(id);
    setConfirmId(null);
    if (entries.length <= 1) onClose();
  }

  return (
    <Modal open onClose={onClose} title={formatLongPl(fromISODate(date))}>
      <div className="flex flex-col gap-3">
        {entries.map((e) => {
          const band = painBand(e.intensity);
          return (
            <div key={e.id} className="card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-2xl font-bold ${bandText[band]}`}>{e.intensity}</span>
                  <span className="ml-2 text-sm text-stone-500 dark:text-stone-400">{painLabel(e.intensity)}</span>
                </div>
                {e.startTime && <span className="text-sm text-stone-500 dark:text-stone-400">{e.startTime}</span>}
              </div>
              {e.meds.length > 0 && (
                <p className="mt-1 text-sm">💊 {e.meds.map((m) => m.name).join(', ')}</p>
              )}
              {e.notes && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{e.notes}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => navigate(`/wpis/${e.id}`)}>
                  Edytuj
                </button>
                {confirmId === e.id ? (
                  <button type="button" className="btn flex-1 bg-red-600 text-white hover:bg-red-700" onClick={() => handleDelete(e.id)}>
                    Na pewno usuń?
                  </button>
                ) : (
                  <button type="button" className="btn-secondary flex-1" onClick={() => setConfirmId(e.id)}>
                    Usuń
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <button type="button" className="btn-primary" onClick={() => navigate(`/wpis/nowy?data=${date}`)}>
          + Dodaj kolejny epizod tego dnia
        </button>
      </div>
    </Modal>
  );
}
