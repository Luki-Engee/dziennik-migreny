import { nanoid } from './id';
import { db, ensureSeeded } from './db';
import type { AppSettings, Entry, OptionCategory, OptionItem } from '../types';

export interface Storage {
  init(): Promise<void>;
  listEntries(): Promise<Entry[]>;
  getEntry(id: string): Promise<Entry | undefined>;
  getEntriesForDate(date: string): Promise<Entry[]>;
  saveEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Entry>;
  deleteEntry(id: string): Promise<void>;

  listOptions(category: OptionCategory): Promise<OptionItem[]>;
  addOption(category: OptionCategory, label: string): Promise<OptionItem>;
  updateOption(category: OptionCategory, item: OptionItem): Promise<void>;
  deleteOption(category: OptionCategory, id: string): Promise<void>;
  bumpUsage(category: OptionCategory, ids: string[]): Promise<void>;

  getSettings(): Promise<AppSettings>;
  saveSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  exportAll(): Promise<{ entries: Entry[]; options: Record<OptionCategory, OptionItem[]>; settings: AppSettings }>;
  importAll(data: { entries: Entry[]; options?: Record<OptionCategory, OptionItem[]>; settings?: AppSettings }, mode: 'merge' | 'replace'): Promise<void>;
}

class DexieStorage implements Storage {
  async init() {
    await ensureSeeded();
  }

  async listEntries() {
    return db.entries.orderBy('date').toArray();
  }

  async getEntry(id: string) {
    return db.entries.get(id);
  }

  async getEntriesForDate(date: string) {
    return db.entries.where('date').equals(date).toArray();
  }

  async saveEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    const now = new Date().toISOString();
    let full: Entry;
    if (entry.id) {
      const existing = await db.entries.get(entry.id);
      full = { ...(existing as Entry), ...entry, id: entry.id, updatedAt: now, createdAt: existing?.createdAt ?? now };
    } else {
      full = { ...entry, id: nanoid(), createdAt: now, updatedAt: now } as Entry;
    }
    await db.entries.put(full);
    return full;
  }

  async deleteEntry(id: string) {
    await db.entries.delete(id);
  }

  async listOptions(category: OptionCategory) {
    const rows = await db.options.where('category').equals(category).toArray();
    return rows.map((r) => r.item).sort((a, b) => b.usageCount - a.usageCount || a.order - b.order);
  }

  async addOption(category: OptionCategory, label: string) {
    const trimmed = label.trim();
    const existingRows = await db.options.where('category').equals(category).toArray();
    const id = `${trimmed.toLowerCase().replace(/[^a-ząćęłńóśźż0-9]+/gi, '-')}-${Date.now().toString(36)}`;
    const item: OptionItem = { id, label: trimmed, hidden: false, order: existingRows.length, usageCount: 0 };
    await db.options.put({ category, item });
    return item;
  }

  async updateOption(category: OptionCategory, item: OptionItem) {
    await db.options.put({ category, item });
  }

  async deleteOption(category: OptionCategory, id: string) {
    // Nie usuwamy fizycznie, żeby nie psuć starych wpisów – oznaczamy jako ukryte.
    const row = await db.options.get([category, id]);
    if (row) {
      row.item.hidden = true;
      await db.options.put(row);
    }
  }

  async bumpUsage(category: OptionCategory, ids: string[]) {
    for (const id of ids) {
      const row = await db.options.get([category, id]);
      if (row) {
        row.item.usageCount += 1;
        await db.options.put(row);
      }
    }
  }

  async getSettings() {
    const s = await db.settings.get('settings');
    if (!s) throw new Error('Brak ustawień – wywołaj init()');
    return s;
  }

  async saveSettings(partial: Partial<AppSettings>) {
    const current = await this.getSettings();
    const merged = { ...current, ...partial };
    await db.settings.put(merged);
    return merged;
  }

  async exportAll() {
    const entries = await this.listEntries();
    const categories: OptionCategory[] = ['locations', 'painType', 'auraSymptoms', 'symptoms', 'triggers', 'weather', 'food', 'reliefs', 'medNames'];
    const options = {} as Record<OptionCategory, OptionItem[]>;
    for (const c of categories) {
      options[c] = await this.listOptions(c);
    }
    const settings = await this.getSettings();
    return { entries, options, settings };
  }

  async importAll(data: { entries: Entry[]; options?: Record<OptionCategory, OptionItem[]>; settings?: AppSettings }, mode: 'merge' | 'replace') {
    if (mode === 'replace') {
      await db.entries.clear();
    }
    await db.entries.bulkPut(data.entries);
    if (data.options) {
      for (const category of Object.keys(data.options) as OptionCategory[]) {
        for (const item of data.options[category]) {
          await db.options.put({ category, item });
        }
      }
    }
    if (data.settings) {
      await db.settings.put(data.settings);
    }
  }
}

export const storage: Storage = new DexieStorage();
