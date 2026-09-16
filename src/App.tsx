import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './lib/db';
import { storage } from './lib/storage';
import BottomNav from './components/BottomNav';
import PinLockScreen from './components/PinLockScreen';
import CalendarView from './features/calendar/CalendarView';
import EntryForm from './features/entry-form/EntryForm';

// Statystyki (recharts) i ustawienia (jsPDF/autotable) są cięższe niż kalendarz,
// który jest pierwszym widokiem na telefonie – wydzielone do osobnych chunków.
const StatsView = lazy(() => import('./features/stats/StatsView'));
const SettingsView = lazy(() => import('./features/settings/SettingsView'));
const MyOptions = lazy(() => import('./features/settings/MyOptions'));

function RouteFallback() {
  return <div className="flex min-h-screen items-center justify-center text-stone-400">Wczytywanie…</div>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    storage.init().then(() => setReady(true));
  }, []);

  const settings = useLiveQuery(() => (ready ? db.settings.get('settings') : undefined), [ready]);

  if (!ready || (settings === undefined && !ready)) {
    return <div className="flex min-h-screen items-center justify-center text-stone-400">Wczytywanie…</div>;
  }

  if (settings?.pinEnabled && settings.pinHash && !unlocked) {
    return <PinLockScreen expectedHash={settings.pinHash} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<CalendarView />} />
          <Route path="/wpis/:id" element={<EntryForm />} />
          <Route path="/statystyki" element={<StatsView />} />
          <Route path="/ustawienia" element={<SettingsView />} />
          <Route path="/ustawienia/moje-opcje" element={<MyOptions />} />
          <Route path="/ustawienia/moje-opcje/:category" element={<MyOptions />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </div>
  );
}
