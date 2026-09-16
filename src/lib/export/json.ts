import type { AppSettings, Entry, OptionCategory, OptionItem } from '../../types';

export interface BackupFile {
  version: 1;
  exportedAt: string;
  entries: Entry[];
  options: Record<OptionCategory, OptionItem[]>;
  settings: AppSettings;
}

export function buildBackup(data: { entries: Entry[]; options: Record<OptionCategory, OptionItem[]>; settings: AppSettings }): BackupFile {
  return { version: 1, exportedAt: new Date().toISOString(), ...data };
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function isValidBackup(data: unknown): data is BackupFile {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return Array.isArray(d.entries) && typeof d.settings === 'object';
}
