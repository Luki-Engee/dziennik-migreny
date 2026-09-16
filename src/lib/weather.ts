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

export async function fetchWeatherForDate(lat: number, lon: number, dateISO: string): Promise<AutoWeather | null> {
  const start = new Date(dateISO);
  const prevDay = new Date(start);
  prevDay.setDate(prevDay.getDate() - 1);
  const startStr = prevDay.toISOString().slice(0, 10);

  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startStr}&end_date=${dateISO}` +
    `&hourly=temperature_2m,surface_pressure,relative_humidity_2m&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const times: string[] = data.hourly?.time ?? [];
    const pressures: number[] = data.hourly?.surface_pressure ?? [];
    const temps: number[] = data.hourly?.temperature_2m ?? [];
    const humidity: number[] = data.hourly?.relative_humidity_2m ?? [];
    if (times.length === 0) return null;

    const targetIdx = times.findIndex((t) => t.startsWith(`${dateISO}T12`));
    const idx = targetIdx >= 0 ? targetIdx : times.length - 1;
    const prevIdx = Math.max(0, idx - 24);

    return {
      tempC: temps[idx],
      pressureHpa: pressures[idx],
      pressureDelta24h: pressures[idx] - pressures[prevIdx],
      humidity: humidity[idx],
    };
  } catch {
    return null;
  }
}
