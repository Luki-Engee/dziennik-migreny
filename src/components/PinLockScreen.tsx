import { useEffect, useState } from 'react';
import { hashPin } from '../lib/pin';

interface Props {
  expectedHash: string;
  onUnlock: () => void;
}

export default function PinLockScreen({ expectedHash, onUnlock }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length !== 4) return;
    let cancelled = false;
    hashPin(pin).then((hash) => {
      if (cancelled) return;
      if (hash === expectedHash) {
        onUnlock();
      } else {
        setError(true);
        setPin('');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pin, expectedHash, onUnlock]);

  function press(digit: string) {
    setError(false);
    setPin((p) => (p.length < 4 ? p + digit : p));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-brand-50 dark:bg-stone-900">
      <h1 className="text-lg font-bold">Dziennik Migreny</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400">Podaj PIN, aby odblokować</p>
      <div className="flex gap-3" aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full border-2 ${i < pin.length ? 'bg-brand-500 border-brand-500' : 'border-stone-300'}`} />
        ))}
      </div>
      {error && <p className="text-sm text-red-600">Błędny PIN</p>}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
          d === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              className="min-h-touch min-w-touch rounded-full bg-white text-xl font-semibold shadow-sm dark:bg-stone-800"
              onClick={() => (d === '⌫' ? setPin((p) => p.slice(0, -1)) : press(d))}
            >
              {d}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
