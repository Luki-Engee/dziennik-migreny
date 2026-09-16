import { subDays } from 'date-fns';
import { db } from './db';
import { toISODate } from './dates';
import { nanoid } from './id';
import type { Entry } from '../types';

const DEMO_TAG = 'demo-2f8a';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSome<T>(arr: T[], max: number): T[] {
  const n = Math.floor(Math.random() * (max + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export async function loadDemoData(optionIds: {
  locations: string[]; painType: string[]; symptoms: string[]; triggers: string[]; weather: string[]; food: string[]; reliefs: string[];
}) {
  const now = new Date();
  const entries: Entry[] = [];
  for (let i = 0; i < 45; i++) {
    if (Math.random() > 0.35) continue;
    const date = toISODate(subDays(now, Math.floor(Math.random() * 120)));
    const intensity = (Math.floor(Math.random() * 10) + 1) as Entry['intensity'];
    const iso = new Date().toISOString();
    entries.push({
      id: `${DEMO_TAG}-${nanoid(8)}`,
      date,
      startTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:00`,
      duration: pick(['<1h', '1-4h', '4-12h', '12-24h', '>24h']),
      intensity,
      locations: pickSome(optionIds.locations, 2),
      painType: pickSome(optionIds.painType, 1),
      aura: Math.random() > 0.8,
      auraSymptoms: [],
      symptoms: pickSome(optionIds.symptoms, 3),
      triggers: pickSome(optionIds.triggers, 2),
      weather: pickSome(optionIds.weather, 1),
      food: pickSome(optionIds.food, 1),
      meds: Math.random() > 0.4 ? [{ name: 'Ibuprofen', dose: '400 mg', effect: pick(['brak', 'trochę', 'pomógł', 'całkowicie']) }] : [],
      reliefs: pickSome(optionIds.reliefs, 2),
      menstruation: Math.random() > 0.85,
      notes: '',
      createdAt: iso,
      updatedAt: iso,
    });
  }
  await db.entries.bulkPut(entries);
}

export async function removeDemoData() {
  const all = await db.entries.toArray();
  const demoIds = all.filter((e) => e.id.startsWith(DEMO_TAG)).map((e) => e.id);
  await db.entries.bulkDelete(demoIds);
}

export async function hasDemoData(): Promise<boolean> {
  const all = await db.entries.toArray();
  return all.some((e) => e.id.startsWith(DEMO_TAG));
}
