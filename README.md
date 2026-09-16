# Dziennik Migreny

Prosty, przyjazny dziennik (PWA) do zapisywania epizodów migreny / bólu głowy. Działa w 100% w przeglądarce — **żadne dane nie opuszczają Twojego urządzenia** (zapisywane lokalnie w IndexedDB). Można zainstalować na telefonie jak zwykłą aplikację i korzystać offline.

## Funkcje

- Kalendarz miesięczny z kolorowym oznaczeniem siły bólu i ikoną leku.
- Szybki formularz wpisu (wymagane tylko data i siła bólu), z chipami, sekcjami zwijanymi i możliwością dodawania własnych opcji.
- Statystyki (miesiąc / 3 miesiące / rok): dni z bólem, średnia siła, wyzwalacze, pogoda, jedzenie, pora dnia, dzień tygodnia, skuteczność leków, powiązanie z cyklem.
- Eksport raportu dla lekarza (PDF, z polskimi znakami), eksport CSV (Excel), pełna kopia zapasowa JSON (import/eksport, scalanie lub zastępowanie).
- Tryb ciemny/jasny zgodny z ustawieniami systemu, duże pola dotykowe, obsługa offline (PWA).
- Faza 2 (opcjonalnie): automatyczne dane pogodowe z Open-Meteo, blokada aplikacji PIN-em.

## Wymagania

- [Node.js](https://nodejs.org/) w wersji 18 lub nowszej (zalecana 20+) oraz npm.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja otworzy się pod adresem `http://localhost:5173` (lub innym wolnym porcie, który wypisze Vite).

## Budowanie do plików statycznych

```bash
npm run build
```

Gotowe pliki znajdą się w folderze `dist/`. Podgląd zbudowanej wersji lokalnie:

```bash
npm run preview
```

## Testy

```bash
npm run test
```

Testy jednostkowe (Vitest) obejmują logikę statystyk, eksport CSV oraz migracje schematu bazy danych.

## Wdrożenie

Aplikacja jest skonfigurowana z relatywną ścieżką bazową (`base: './'` w `vite.config.ts`), więc zbudowana wersja z `dist/` działa poprawnie zarówno w katalogu głównym domeny, jak i w podkatalogu (np. `użytkownik.github.io/nazwa-repo/`) — nie trzeba nic zmieniać.

### GitHub Pages

1. Zbuduj projekt: `npm run build`.
2. Wypchnij zawartość folderu `dist/` do gałęzi `gh-pages` (najprościej za pomocą pakietu [`gh-pages`](https://www.npmjs.com/package/gh-pages)):
   ```bash
   npm install --save-dev gh-pages
   npx gh-pages -d dist
   ```
3. W ustawieniach repozytorium na GitHubie włącz GitHub Pages dla gałęzi `gh-pages`.
4. Aplikacja będzie dostępna pod adresem `https://<użytkownik>.github.io/<nazwa-repo>/`.

### Netlify

1. Zbuduj projekt: `npm run build`.
2. Wdróż zawartość folderu `dist/` np. przez przeciągnięcie folderu na [app.netlify.com/drop](https://app.netlify.com/drop), albo połącz repozytorium z Netlify i ustaw:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

## Instalacja na telefonie

Aplikacja jest w pełni funkcjonalną PWA (Progressive Web App) — instaluje się jak zwykła aplikacja i działa offline.

**Android (Chrome):**
1. Otwórz adres aplikacji w Chrome.
2. Dotknij menu (⋮) → **„Dodaj do ekranu głównego”** (lub poczekaj na baner z propozycją instalacji).
3. Potwierdź — ikona „Dziennik Migreny” pojawi się na ekranie głównym.

**iOS (Safari):**
1. Otwórz adres aplikacji w Safari (instalacja PWA na iOS działa tylko z poziomu Safari).
2. Dotknij ikony **Udostępnij** (kwadrat ze strzałką w górę).
3. Wybierz **„Dodaj do ekranu początkowego”**.
4. Potwierdź — aplikacja uruchomi się w pełnoekranowym trybie, bez paska adresu przeglądarki.

## Kopie zapasowe

Ponieważ dane są przechowywane wyłącznie lokalnie na urządzeniu (nie ma serwera ani logowania), **regularne kopie zapasowe są ważne** — np. przed zmianą telefonu, czyszczeniem danych przeglądarki albo odinstalowaniem aplikacji.

- W **Ustawienia → Raport i kopie zapasowe** wybierz **„Eksportuj kopię zapasową (JSON)”** — pobierze się plik zawierający wszystkie wpisy, własne opcje i ustawienia.
- Plik JSON możesz z powrotem wczytać przyciskiem **„Importuj kopię zapasową (JSON)”** — wybierzesz wtedy, czy dane mają zostać **scalone** z istniejącymi, czy je **zastąpić**.
- Jeśli od ostatniej kopii minie więcej niż 30 dni, aplikacja przypomni o tym w ustawieniach.
- Dodatkowo dostępny jest eksport CSV (do Excela/Arkuszy Google) oraz eksport PDF („Raport dla lekarza”) — te formaty nie nadają się jednak do pełnego przywrócenia danych, służą tylko do przeglądania/druku.

## Stos technologiczny

Vite, React, TypeScript, Tailwind CSS, Dexie (IndexedDB), react-day-picker + date-fns (lokalizacja PL), Recharts, jsPDF + jspdf-autotable, vite-plugin-pwa, Vitest.

Czcionka użyta do generowania PDF (DejaVu Sans, plik `src/lib/export/pdfFonts.ts`) jest oparta na krojach Bitstream Vera / DejaVu i objęta wolną licencją pozwalającą na embedowanie — zob. `src/assets/fonts/LICENSE_DEJAVU.txt`.
