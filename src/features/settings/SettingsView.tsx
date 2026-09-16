import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { differenceInDays } from 'date-fns';
import { db } from '../../lib/db';
import { storage } from '../../lib/storage';
import { entriesToCsv, downloadCsv } from '../../lib/export/csv';
import { buildBackup, downloadJson, isValidBackup } from '../../lib/export/json';
import { hashPin } from '../../lib/pin';
import { searchCity, type CityResult } from '../../lib/weather';
import { loadDemoData, removeDemoData, hasDemoData } from '../../lib/demoData';
import { todayISO } from '../../lib/dates';
import type { OptionCategory, OptionItem } from '../../types';

export default function SettingsView() {
  const navigate = useNavigate();
  const settings = useLiveQuery(() => db.settings.get('settings'), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    hasDemoData().then(setDemoLoaded);
  }, []);

  const daysSinceBackup = settings?.lastBackupAt ? differenceInDays(new Date(), new Date(settings.lastBackupAt)) : null;
  const backupOverdue = daysSinceBackup !== null && daysSinceBackup > 30;

  async function handleExportCsv() {
    const { entries, options } = await storage.exportAll();
    const csv = entriesToCsv(entries, options);
    downloadCsv(csv, `dziennik-migreny_${todayISO()}.csv`);
    await storage.saveSettings({ lastBackupAt: new Date().toISOString() });
  }

  async function handleExportJson() {
    const data = await storage.exportAll();
    downloadJson(buildBackup(data), `dziennik-migreny-backup_${todayISO()}.json`);
    await storage.saveSettings({ lastBackupAt: new Date().toISOString() });
  }

  async function handleExportPdf() {
    const { entries, options } = await storage.exportAll();
    if (entries.length === 0) return;
    const from = entries[0].date;
    const to = entries[entries.length - 1].date;
    const { downloadDoctorReport } = await import('../../lib/export/pdf');
    downloadDoctorReport(entries, options, { from, to });
  }

  async function handleImportFile(file: File) {
    setImportMsg(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!isValidBackup(data)) {
        setImportMsg('Nieprawidłowy plik kopii zapasowej.');
        return;
      }
      const mode = window.confirm('Scalić z istniejącymi danymi (OK) czy zastąpić wszystko (Anuluj = zastąp)?') ? 'merge' : 'replace';
      await storage.importAll(data, mode as 'merge' | 'replace');
      setImportMsg(`Zaimportowano ${data.entries.length} wpisów (${mode === 'merge' ? 'scalono' : 'zastąpiono'}).`);
    } catch {
      setImportMsg('Nie udało się odczytać pliku JSON.');
    }
  }

  async function toggleDemoData() {
    if (demoLoaded) {
      await removeDemoData();
      setDemoLoaded(false);
      return;
    }
    const categories: OptionCategory[] = ['locations', 'painType', 'symptoms', 'triggers', 'weather', 'food', 'reliefs'];
    const ids: Record<string, string[]> = {};
    for (const c of categories) {
      const opts: OptionItem[] = await storage.listOptions(c);
      ids[c] = opts.map((o) => o.id);
    }
    await loadDemoData(ids as any);
    setDemoLoaded(true);
  }

  async function doCitySearch() {
    setCityResults(await searchCity(citySearch));
  }

  async function selectCity(city: CityResult) {
    await storage.saveSettings({
      weatherCity: `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}`,
      weatherLat: city.latitude,
      weatherLon: city.longitude,
    });
    setCityResults([]);
    setCitySearch('');
  }

  async function enablePin() {
    if (pinInput.length !== 4) return;
    const hash = await hashPin(pinInput);
    await storage.saveSettings({ pinEnabled: true, pinHash: hash });
    setPinInput('');
  }

  async function disablePin() {
    await storage.saveSettings({ pinEnabled: false, pinHash: undefined });
  }

  if (!settings) return null;

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <h1 className="mb-4 text-lg font-bold">Ustawienia</h1>

      <div className="flex flex-col gap-4">
        <button type="button" className="card flex min-h-touch items-center justify-between px-4 py-3 text-left" onClick={() => navigate('/ustawienia/moje-opcje')}>
          <span className="font-semibold">Moje opcje</span>
          <span aria-hidden>›</span>
        </button>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Raport i kopie zapasowe</h2>
          {backupOverdue && (
            <p className="mb-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              Od ostatniej kopii zapasowej minęło {daysSinceBackup} dni. Rozważ eksport danych.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <button type="button" className="btn-secondary" onClick={handleExportPdf}>Eksportuj raport dla lekarza (PDF)</button>
            <button type="button" className="btn-secondary" onClick={handleExportCsv}>Eksportuj CSV</button>
            <button type="button" className="btn-secondary" onClick={handleExportJson}>Eksportuj kopię zapasową (JSON)</button>
            <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Importuj kopię zapasową (JSON)</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
            />
            {importMsg && <p className="text-sm text-stone-600 dark:text-stone-300">{importMsg}</p>}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Dane demonstracyjne</h2>
          <p className="mb-2 text-sm text-stone-500 dark:text-stone-400">Wczytaj przykładowe wpisy, aby wypróbować statystyki i eksporty.</p>
          <button type="button" className="btn-secondary" onClick={toggleDemoData}>
            {demoLoaded ? 'Usuń dane demo' : 'Wczytaj dane demo'}
          </button>
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Pogoda (faza 2)</h2>
          <p className="mb-2 text-sm text-stone-500 dark:text-stone-400">
            Lokalizacja: {settings.weatherCity ?? 'nie ustawiono'}
          </p>
          <div className="flex gap-2">
            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Wpisz miasto"
              className="min-h-touch flex-1 rounded-xl2 border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-800"
            />
            <button type="button" className="btn-secondary" onClick={doCitySearch}>Szukaj</button>
          </div>
          {cityResults.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {cityResults.map((c, i) => (
                <li key={i}>
                  <button type="button" className="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700" onClick={() => selectCity(c)}>
                    {c.name}{c.admin1 ? `, ${c.admin1}` : ''} ({c.country})
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Blokada PIN (faza 2)</h2>
          {settings.pinEnabled ? (
            <button type="button" className="btn-secondary" onClick={disablePin}>Wyłącz blokadę PIN</button>
          ) : (
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 cyfry"
                className="min-h-touch w-24 rounded-xl2 border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-800"
              />
              <button type="button" className="btn-secondary" onClick={enablePin}>Ustaw PIN</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
