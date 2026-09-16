import type { AutoWeather } from '../types';

export interface CityResult {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
}

export async function searchCity(query: string): Promise<CityResult[]> {
  if (!query.trim()) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pl&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

const HOURLY_FIELDS = 'temperature_2m,surface_pressure,relative_humidity_2m,wind_speed_10m';

function pickFromHourly(data: any, dateISO: string): AutoWeather | null {
  const times: string[] = data.hourly?.time ?? [];
  const pressures: number[] = data.hourly?.surface_pressure ?? [];
  const temps: number[] = data.hourly?.temperature_2m ?? [];
  const humidity: number[] = data.hourly?.relative_humidity_2m ?? [];
  const wind: number[] = data.hourly?.wind_speed_10m ?? [];
  if (times.length === 0) return null;

  const targetIdx = times.findIndex((t) => t.startsWith(`${dateISO}T12`));
  const idx = targetIdx >= 0 ? targetIdx : times.length - 1;
  const prevIdx = Math.max(0, idx - 24);
  if (pressures[idx] == null || temps[idx] == null) return null;

  return {
    tempC: temps[idx],
    pressureHpa: pressures[idx],
    pressureDelta24h: pressures[idx] - (pressures[prevIdx] ?? pressures[idx]),
    humidity: humidity[idx],
    windKph: wind[idx],
    fetchedAt: new Date().toISOString(),
  };
}

function daysSince(dateISO: string): number {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const msPerDay = 86400000;
  return Math.round((new Date(todayIso).getTime() - new Date(dateISO).getTime()) / msPerDay);
}

// Prognoza Open-Meteo (forecast API) obejmuje też do ~90 dni wstecz i nie ma opóźnienia
// w publikacji danych, w przeciwieństwie do archive API – dzięki temu działa dla wpisu
// dodanego "dziś". Dla starszych dat (poza zakresem forecast) korzystamy z archive API,
// gdzie ewentualne opóźnienie publikacji nie ma już znaczenia (dane są historyczne).
async function fetchViaForecastApi(lat: number, lon: number, dateISO: string, age: number): Promise<AutoWeather | null> {
  const pastDays = Math.min(92, Math.max(1, age + 1));
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=${HOURLY_FIELDS}&past_days=${pastDays}&forecast_days=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return pickFromHourly(await res.json(), dateISO);
}

async function fetchViaArchiveApi(lat: number, lon: number, dateISO: string): Promise<AutoWeather | null> {
  const prevDay = new Date(dateISO);
  prevDay.setDate(prevDay.getDate() - 1);
  const startStr = prevDay.toISOString().slice(0, 10);
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startStr}&end_date=${dateISO}` +
    `&hourly=${HOURLY_FIELDS}&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return pickFromHourly(await res.json(), dateISO);
}

/**
 * Zwraca przybliżone dane pogodowe dla danego dnia (trend, nie precyzja co do minuty):
 * temperatura, ciśnienie, jego zmiana w ciągu 24h, wilgotność, wiatr.
 */
export async function fetchWeatherForDate(lat: number, lon: number, dateISO: string): Promise<AutoWeather | null> {
  const age = daysSince(dateISO);
  try {
    if (age >= 0 && age <= 90) {
      const viaForecast = await fetchViaForecastApi(lat, lon, dateISO, age);
      if (viaForecast) return viaForecast;
    }
    return await fetchViaArchiveApi(lat, lon, dateISO);
  } catch {
    return null;
  }
}
