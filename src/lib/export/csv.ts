import type { Entry, OptionCategory, OptionItem } from '../../types';

function labelsFor(ids: string[], options: OptionItem[]): string {
  const byId = new Map(options.map((o) => [o.id, o.label]));
  return ids.map((id) => byId.get(id) ?? id).join(', ');
}

function csvField(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[";\n]/.test(value) ? `"${escaped}"` : escaped;
}

export function entriesToCsv(entries: Entry[], options: Record<OptionCategory, OptionItem[]>): string {
  const headers = [
    'Data', 'Godzina', 'Czas trwania', 'Siła bólu', 'Lokalizacja', 'Charakter bólu',
    'Aura', 'Objawy aury', 'Objawy towarzyszące', 'Wyzwalacze', 'Pogoda', 'Jedzenie',
    'Leki', 'Co pomogło', 'Miesiączka', 'Notatki',
  ];

  const rows = entries.map((e) => [
    e.date,
    e.startTime ?? '',
    e.duration ?? '',
    String(e.intensity),
    labelsFor(e.locations, options.locations),
    labelsFor(e.painType, options.painType),
    e.aura ? 'Tak' : 'Nie',
    labelsFor(e.auraSymptoms, options.auraSymptoms),
    labelsFor(e.symptoms, options.symptoms),
    labelsFor(e.triggers, options.triggers),
    labelsFor(e.weather, options.weather),
    labelsFor(e.food, options.food),
    e.meds.map((m) => `${m.name}${m.dose ? ' ' + m.dose : ''}${m.effect ? ' (' + m.effect + ')' : ''}`).join(', '),
    labelsFor(e.reliefs, options.reliefs),
    e.menstruation ? 'Tak' : 'Nie',
    e.notes ?? '',
  ]);

  const lines = [headers, ...rows].map((row) => row.map(csvField).join(';'));
  return lines.join('\r\n');
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
