import Dexie, { type Table } from 'dexie';
import type { AppSettings, Entry, OptionCategory, OptionItem } from '../types';
import { DEFAULT_OPTIONS } from './defaultOptions';

export interface OptionRow {
  category: OptionCategory;
  item: OptionItem;
}

export const SCHEMA_VERSION = 2;

class MigrenaDB extends Dexie {
  entries!: Table<Entry, string>;
  options!: Table<OptionRow, [OptionCategory, string]>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('dziennik-migreny');
    this.version(1).stores({
      entries: 'id, date',
      options: '[category+item.id], category',
      settings: 'id',
    });
    // v2: dodano indeks updatedAt (sortowanie wg ostatniej edycji, np. w EntryForm).
    this.version(2).stores({
      entries: 'id, date, updatedAt',
      options: '[category+item.id], category',
      settings: 'id',
    });
  }
}

export const db = new MigrenaDB();

export async function ensureSeeded(): Promise<void> {
  const count = await db.options.count();
  if (count === 0) {
    const rows: OptionRow[] = [];
    (Object.keys(DEFAULT_OPTIONS) as OptionCategory[]).forEach((category) => {
      DEFAULT_OPTIONS[category].forEach((item) => rows.push({ category, item }));
    });
    await db.options.bulkPut(rows);
  }
  const settings = await db.settings.get('settings');
  if (!settings) {
    await db.settings.put({
      id: 'settings',
      theme: 'system',
      pinEnabled: false,
      schemaVersion: SCHEMA_VERSION,
    });
  }
}
