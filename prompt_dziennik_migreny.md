# Prompt dla Claude Code – „Dziennik Migreny”

Zbuduj aplikację webową **„Dziennik Migreny”** – prosty, przyjazny kalendarz do zapisywania epizodów bólu głowy (migreny) przez nastolatkę/młodą osobę, głównie na telefonie. Interfejs w całości po polsku.

## Stack i architektura
- Vite + React + TypeScript + Tailwind CSS.
- Aplikacja działająca w 100% po stronie klienta, bez backendu i bez logowania. Dane zdrowotne nie opuszczają urządzenia.
- Zapis danych w IndexedDB (np. przez `idb` lub `dexie`), z warstwą abstrakcji `storage.ts`, żeby w przyszłości dało się podmienić na synchronizację w chmurze.
- PWA (`vite-plugin-pwa`): instalacja na ekranie głównym telefonu, działanie offline, ikona i nazwa „Dziennik Migreny”.
- Mobile-first, duże pola dotykowe (min. 44 px), tryb jasny/ciemny zgodny z systemem.
- Build do statycznych plików, gotowy do wrzucenia na GitHub Pages lub Netlify (ustaw poprawny `base` w Vite i dodaj instrukcję wdrożenia w README).

## Widok główny – kalendarz
- Widok miesiąca z nawigacją ← / → i przyciskiem „Dziś”.
- Dni z wpisem oznaczone kolorową kropką/tłem zależnym od siły bólu (1–3 zielony, 4–6 żółty/pomarańczowy, 7–10 czerwony), z cyfrą siły bólu w rogu dnia.
- Dzień z przyjętym lekiem przeciwbólowym dodatkowo oznaczony małą ikoną tabletki.
- Kliknięcie dnia: jeśli brak wpisu → formularz nowego wpisu; jeśli jest → podgląd z opcją edycji, usunięcia (z potwierdzeniem) i dodania kolejnego epizodu tego samego dnia.
- Duży pływający przycisk „+ Dodaj ból głowy” (domyślnie dzisiejsza data i bieżąca godzina).

## Formularz wpisu
Formularz podzielony na zwijane sekcje, żeby nie przytłaczał. Wymagane są tylko data i siła bólu – reszta opcjonalna, tak żeby szybki wpis zajmował kilka sekund.

1. **Kiedy**:
   - **Data wybierana z kalendarza**, a nie wpisywana ręcznie. Pole daty pokazuje wybraną datę słownie (np. „śr, 16 września 2026”). Po dotknięciu otwiera się wyskakujący kalendarz miesięczny (modal / bottom sheet na telefonie) w tym samym stylu co widok główny. Kalendarz ma nawigację między miesiącami, zaznaczony dzisiejszy dzień i dni z istniejącymi wpisami. Tydzień zaczyna się od poniedziałka, a nazwy dni i miesięcy są po polsku. Nad kalendarzem są szybkie przyciski „Dziś” i „Wczoraj”. Daty z przyszłości są zablokowane. Nie używaj natywnego `<input type="date">`; zbuduj własny komponent `DatePicker` (może bazować na `react-day-picker` + `date-fns` z lokalizacją `pl`).
   - Godzina rozpoczęcia wybierana z listy / pickera (co 15 min), z przyciskiem „Teraz”.
   - Czas trwania: szybkie przyciski <1 h, 1–4 h, 4–12 h, 12–24 h, >24 h, „nadal trwa”.
2. **Siła bólu (wymagane)**: pole jednokrotnego wyboru w skali **1–10**, w postaci 10 dużych przycisków w dwóch rzędach (1–5 i 6–10). Każdy przycisk ma kolor według skali: 1–3 zielony, 4–6 żółty/pomarańczowy, 7–10 czerwony. Wybrany przycisk jest wyraźnie wyróżniony. Pod przyciskami widnieje podpis słowny aktualnego wyboru: 1–3 „łagodny”, 4–6 „umiarkowany”, 7–8 „silny”, 9–10 „bardzo silny / nie do wytrzymania”. Nie używaj suwaka.
3. **Lokalizacja bólu** (wybór wielokrotny): lewa strona, prawa strona, obie strony, czoło, skronie, za oczami, potylica/kark.
4. **Charakter bólu**: pulsujący, uciskający, kłujący, tępy.
5. **Aura** (tak/nie) i jeśli tak: zaburzenia widzenia, mrowienie, zaburzenia mowy.
6. **Objawy towarzyszące**: nudności, wymioty, nadwrażliwość na światło, na dźwięk, na zapachy, zawroty głowy, zmęczenie.
7. **Możliwe przyczyny / wyzwalacze**: stres, za mało snu, za dużo snu, pominięty posiłek, za mało picia, długo przed ekranem, wysiłek fizyczny, hałas, jasne/migające światło, zapachy, okres przed miesiączką (PMS), podróż, szkoła/sprawdzian.
8. **Pogoda**: upał, zimno, zmiana ciśnienia, burza, deszcz, silny wiatr / halny, duszno, ostre słońce, zmiana pogody.
9. **Jedzenie i picie**: czekolada, żółte sery, kawa/herbata/energetyki (kofeina), cola, cytrusy, wędliny/kiełbasy, słodziki, fast food / glutaminian sodu, orzechy, lody/zimne napoje, „nic szczególnego”.
10. **Leki**: nazwa (lista z możliwością dopisania), dawka, godzina, skuteczność (nie pomógł / trochę / pomógł / całkowicie).
11. **Co jeszcze pomogło**: sen, ciemny pokój, zimny okład, picie wody, jedzenie, świeże powietrze.
12. **Miesiączka**: osobny przełącznik „Miesiączka tego dnia” (tak/nie), niezależny od listy wyzwalaczy, żeby w statystykach dało się łatwo sprawdzić powiązanie bólów z cyklem.
13. **Notatki**: pole tekstowe swobodne.

### Wymagania dla pól wyboru
- Wszystkie listy wielokrotnego wyboru jako „chipy” (tagi) do klikania.
- W każdej kategorii przycisk **„+ Inne”** otwierający pole tekstowe; nowo dodana opcja zapisuje się na stałe w tej kategorii i pojawia przy kolejnych wpisach.
- Ekran **Ustawienia → Moje opcje**: edycja, ukrywanie, usuwanie i zmiana kolejności opcji w każdej kategorii (usunięcie opcji nie może psuć starych wpisów – w historii nadal ma się wyświetlać).
- Najczęściej używane opcje wyświetlane jako pierwsze.
- Przycisk „Skopiuj z poprzedniego wpisu” dla szybkiego wypełnienia.

## Statystyki
Osobna zakładka z wyborem zakresu (miesiąc / 3 miesiące / rok):
- liczba dni z bólem w miesiącu (wykres słupkowy), średnia siła bólu, średni czas trwania,
- ranking najczęstszych wyzwalaczy, pogody i jedzenia (poziome słupki),
- rozkład wg dnia tygodnia i pory dnia,
- liczba dni z przyjętymi lekami przeciwbólowymi w miesiącu z delikatną informacją, gdy liczba jest wysoka (np. ≥10 dni), że warto porozmawiać o tym z lekarzem – bez straszenia i bez porad medycznych,
- skuteczność poszczególnych leków,
- odsetek epizodów przypadających na dni miesiączki i okres tuż przed nią.
Wykresy: `recharts`.

## Raport dla lekarza i kopie zapasowe
- **Eksport PDF** „Raport dla lekarza” za wybrany okres: tabela wpisów + podsumowanie statystyk (np. `jspdf` + `jspdf-autotable`, z obsługą polskich znaków – osadź czcionkę z polskimi znakami).
- **Eksport CSV** (separator `;`, kodowanie UTF-8 z BOM, żeby Excel poprawnie otwierał polskie znaki).
- **Eksport / import JSON** jako pełna kopia zapasowa (z walidacją i pytaniem: scal / zastąp).
- Przypomnienie w aplikacji, jeśli od ostatniej kopii zapasowej minęło >30 dni.

## Opcjonalnie (faza 2 – zaimplementuj, jeśli faza 1 działa)
- Automatyczne pobieranie pogody dla daty wpisu z **Open-Meteo** (bez klucza API): temperatura, ciśnienie i jego zmiana w ciągu 24 h, wilgotność. Lokalizacja podawana raz w ustawieniach (miasto → geokodowanie Open-Meteo), bez ciągłego śledzenia GPS. Wyniki zapisywane we wpisie, żeby działały offline.
- Wykres ciśnienia atmosferycznego nałożony na dni z bólem.
- Opcjonalna blokada aplikacji 4-cyfrowym PIN-em (prosta prywatność na współdzielonym telefonie).

## Model danych (propozycja)
```ts
type Entry = {
  id: string; date: string; startTime?: string; duration?: string;
  intensity: 1|2|3|4|5|6|7|8|9|10; locations: string[]; painType: string[];
  aura: boolean; auraSymptoms: string[]; symptoms: string[];
  triggers: string[]; weather: string[]; food: string[];
  meds: { name: string; dose?: string; time?: string; effect?: string }[];
  reliefs: string[]; menstruation?: boolean; notes?: string;
  autoWeather?: { tempC: number; pressureHpa: number; pressureDelta24h: number; humidity: number };
  createdAt: string; updatedAt: string;
};
type OptionSet = Record<Category, { id: string; label: string; hidden: boolean; order: number; usageCount: number }[]>;
```
Dodaj wersjonowanie schematu i migracje.

## Wygląd
- Spokojna, ciepła kolorystyka, zaokrąglone karty, czytelna typografia, bez „szpitalnego” klimatu.
- Dolny pasek nawigacji: Kalendarz / Statystyki / Ustawienia.
- Zadbaj o dostępność (kontrast, etykiety ARIA, obsługa klawiatury).

## Sposób pracy
1. Najpierw przedstaw krótki plan (struktura katalogów, komponenty, biblioteki) i dopiero potem implementuj.
2. Realizuj etapami: szkielet + kalendarz → formularz i opcje → statystyki → eksporty → PWA → faza 2. Po każdym etapie uruchom `npm run build` i napraw błędy.
3. Dodaj testy jednostkowe (Vitest) dla logiki statystyk, eksportu CSV i migracji danych.
4. Dodaj przykładowe dane demo (przycisk „Wczytaj dane demo” w ustawieniach, z możliwością ich usunięcia).
5. Na koniec przygotuj README po polsku: uruchomienie lokalne, build, wdrożenie na GitHub Pages / Netlify, instalacja na telefonie (Android/iOS) oraz jak robić kopie zapasowe.
