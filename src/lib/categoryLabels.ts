import type { OptionCategory } from '../types';

export const CATEGORY_LABELS: Record<OptionCategory, string> = {
  locations: 'Lokalizacja bólu',
  painType: 'Charakter bólu',
  auraSymptoms: 'Objawy aury',
  symptoms: 'Objawy towarzyszące',
  triggers: 'Wyzwalacze',
  weather: 'Pogoda',
  food: 'Jedzenie i picie',
  reliefs: 'Co pomogło',
  medNames: 'Leki',
};

export const CATEGORY_ORDER: OptionCategory[] = [
  'locations', 'painType', 'auraSymptoms', 'symptoms', 'triggers', 'weather', 'food', 'reliefs', 'medNames',
];
