export type Intensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Duration = '<1h' | '1-4h' | '4-12h' | '12-24h' | '>24h' | 'trwa';

export type MedEffect = 'brak' | 'trochę' | 'pomógł' | 'całkowicie';

export type OptionCategory =
  | 'locations'
  | 'painType'
  | 'auraSymptoms'
  | 'symptoms'
  | 'triggers'
  | 'weather'
  | 'food'
  | 'reliefs'
  | 'medNames';

export interface Medication {
  name: string;
  dose?: string;
  time?: string;
  effect?: MedEffect;
}

export interface AutoWeather {
  tempC: number;
  pressureHpa: number;
  pressureDelta24h: number;
  humidity: number;
}

export interface Entry {
  id: string;
  date: string; // yyyy-MM-dd
  startTime?: string; // HH:mm
  duration?: Duration;
  intensity: Intensity;
  locations: string[];
  painType: string[];
  aura: boolean;
  auraSymptoms: string[];
  symptoms: string[];
  triggers: string[];
  weather: string[];
  food: string[];
  meds: Medication[];
  reliefs: string[];
  menstruation?: boolean;
  notes?: string;
  autoWeather?: AutoWeather;
  createdAt: string;
  updatedAt: string;
}

export interface OptionItem {
  id: string;
  label: string;
  hidden: boolean;
  order: number;
  usageCount: number;
}

export type OptionSet = Record<OptionCategory, OptionItem[]>;

export interface AppSettings {
  id: 'settings';
  theme: 'system' | 'light' | 'dark';
  pinEnabled: boolean;
  pinHash?: string;
  weatherCity?: string;
  weatherLat?: number;
  weatherLon?: number;
  lastBackupAt?: string;
  schemaVersion: number;
}

export function painBand(intensity: Intensity): 'low' | 'mid' | 'high' {
  if (intensity <= 3) return 'low';
  if (intensity <= 6) return 'mid';
  return 'high';
}

export function painLabel(intensity: Intensity): string {
  if (intensity <= 3) return 'łagodny';
  if (intensity <= 6) return 'umiarkowany';
  if (intensity <= 8) return 'silny';
  return 'bardzo silny / nie do wytrzymania';
}
