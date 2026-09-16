import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Entry, OptionCategory, OptionItem } from '../../types';
import { avgDurationHours, avgIntensity, daysWithMeds, daysWithPain } from '../stats';
import { fromISODate, formatLongPl } from '../dates';
import { DEJAVU_SANS_BOLD_B64, DEJAVU_SANS_REGULAR_B64 } from './pdfFonts';

function labelsFor(ids: string[], options: OptionItem[]): string {
  const byId = new Map(options.map((o) => [o.id, o.label]));
  return ids.map((id) => byId.get(id) ?? id).join(', ') || '–';
}

function registerPolishFont(doc: jsPDF) {
  doc.addFileToVFS('DejaVuSans.ttf', DEJAVU_SANS_REGULAR_B64);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', DEJAVU_SANS_BOLD_B64);
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
  doc.setFont('DejaVuSans', 'normal');
}

export function buildDoctorReport(
  entries: Entry[],
  options: Record<OptionCategory, OptionItem[]>,
  range: { from: string; to: string },
): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  registerPolishFont(doc);

  doc.setFontSize(16);
  doc.setFont('DejaVuSans', 'bold');
  doc.text('Raport dla lekarza – Dziennik Migreny', 40, 44);

  doc.setFontSize(10);
  doc.setFont('DejaVuSans', 'normal');
  doc.text(
    `Okres: ${formatLongPl(fromISODate(range.from))} – ${formatLongPl(fromISODate(range.to))}`,
    40,
    62,
  );

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  doc.setFontSize(11);
  doc.setFont('DejaVuSans', 'bold');
  doc.text('Podsumowanie', 40, 84);
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(10);
  const summaryLines = [
    `Liczba dni z bólem: ${daysWithPain(sorted)}`,
    `Średnia siła bólu: ${avgIntensity(sorted).toFixed(1)} / 10`,
    `Średni czas trwania epizodu: ${avgDurationHours(sorted).toFixed(1)} h`,
    `Liczba dni z przyjętymi lekami: ${daysWithMeds(sorted)}`,
  ];
  summaryLines.forEach((line, i) => doc.text(line, 40, 100 + i * 14));

  autoTable(doc, {
    startY: 100 + summaryLines.length * 14 + 16,
    styles: { font: 'DejaVuSans', fontSize: 8, cellPadding: 3 },
    headStyles: { font: 'DejaVuSans', fontStyle: 'bold', fillColor: [234, 106, 53] },
    head: [['Data', 'Godz.', 'Siła', 'Lokalizacja', 'Charakter', 'Wyzwalacze', 'Leki', 'Notatki']],
    body: sorted.map((e) => [
      e.date,
      e.startTime ?? '–',
      String(e.intensity),
      labelsFor(e.locations, options.locations),
      labelsFor(e.painType, options.painType),
      labelsFor(e.triggers, options.triggers),
      e.meds.map((m) => m.name).join(', ') || '–',
      e.notes ?? '',
    ]),
    margin: { left: 40, right: 40 },
  });

  return doc;
}

export function downloadDoctorReport(entries: Entry[], options: Record<OptionCategory, OptionItem[]>, range: { from: string; to: string }) {
  const doc = buildDoctorReport(entries, options, range);
  doc.save(`raport-migrena_${range.from}_${range.to}.pdf`);
}
