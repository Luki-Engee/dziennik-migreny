import type { OptionCategory, OptionItem } from '../types';

const mk = (labels: string[]): OptionItem[] =>
  labels.map((label, i) => ({
    id: label.toLowerCase().replace(/[^a-ząćęłńóśźż0-9]+/gi, '-'),
    label,
    hidden: false,
    order: i,
    usageCount: 0,
  }));

export const DEFAULT_OPTIONS: Record<OptionCategory, OptionItem[]> = {
  locations: mk(['Lewa strona', 'Prawa strona', 'Obie strony', 'Czoło', 'Skronie', 'Za oczami', 'Potylica/kark']),
  painType: mk(['Pulsujący', 'Uciskający', 'Kłujący', 'Tępy']),
  auraSymptoms: mk(['Zaburzenia widzenia', 'Mrowienie', 'Zaburzenia mowy']),
  symptoms: mk(['Nudności', 'Wymioty', 'Nadwrażliwość na światło', 'Nadwrażliwość na dźwięk', 'Nadwrażliwość na zapachy', 'Zawroty głowy', 'Zmęczenie']),
  triggers: mk([
    'Stres', 'Za mało snu', 'Za dużo snu', 'Pominięty posiłek', 'Za mało picia',
    'Długo przed ekranem', 'Wysiłek fizyczny', 'Hałas', 'Jasne/migające światło',
    'Zapachy', 'Okres przed miesiączką (PMS)', 'Podróż', 'Szkoła/sprawdzian',
  ]),
  weather: mk(['Upał', 'Zimno', 'Zmiana ciśnienia', 'Burza', 'Deszcz', 'Silny wiatr / halny', 'Duszno', 'Ostre słońce', 'Zmiana pogody']),
  food: mk([
    'Czekolada', 'Żółte sery', 'Kawa/herbata/energetyki (kofeina)', 'Cola', 'Cytrusy',
    'Wędliny/kiełbasy', 'Słodziki', 'Fast food / glutaminian sodu', 'Orzechy',
    'Lody/zimne napoje', 'Nic szczególnego',
  ]),
  reliefs: mk(['Sen', 'Ciemny pokój', 'Zimny okład', 'Picie wody', 'Jedzenie', 'Świeże powietrze']),
  medNames: mk(['Ibuprofen', 'Paracetamol', 'Naproksen', 'Sumatryptan']),
};
