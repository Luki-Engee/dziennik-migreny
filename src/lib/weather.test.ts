import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeatherForDate } from './weather';
import { toISODate } from './dates';

function mockHourlyResponse(dateISO: string, pressureAtNoon: number, pressure24hBefore: number) {
  // 48 godzin danych: dzień poprzedni (indeksy 0-23) + dzień docelowy (indeksy 24-47),
  // tak jak zwraca to prawdziwe Open-Meteo dla zakresu dwóch dni.
  const times: string[] = [];
  const pressures: number[] = [];
  const temps: number[] = [];
  const humidity: number[] = [];
  const wind: number[] = [];
  for (let h = 0; h < 24; h++) {
    times.push(`prev-day-placeholderT${String(h).padStart(2, '0')}:00`);
    pressures.push(pressure24hBefore);
    temps.push(10);
    humidity.push(50);
    wind.push(5);
  }
  for (let h = 0; h < 24; h++) {
    times.push(`${dateISO}T${String(h).padStart(2, '0')}:00`);
    pressures.push(h === 12 ? pressureAtNoon : pressure24hBefore);
    temps.push(h === 12 ? 18 : 10);
    humidity.push(h === 12 ? 55 : 50);
    wind.push(h === 12 ? 12 : 5);
  }
  return {
    hourly: { time: times, surface_pressure: pressures, temperature_2m: temps, relative_humidity_2m: humidity, wind_speed_10m: wind },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchWeatherForDate', () => {
  it('uses the forecast API (no publication lag) for a recent date', async () => {
    const today = toISODate(new Date());
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHourlyResponse(today, 1013, 1017),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchWeatherForDate(52.2, 21.0, today);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('api.open-meteo.com/v1/forecast');
    expect(result).toMatchObject({ tempC: 18, pressureHpa: 1013, humidity: 55, windKph: 12 });
    expect(result?.pressureDelta24h).toBeCloseTo(1013 - 1017);
  });

  it('falls back to the archive API for a date older than the forecast lookback window', async () => {
    const oldDate = '2025-01-01';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHourlyResponse(oldDate, 1000, 1005),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchWeatherForDate(52.2, 21.0, oldDate);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('archive-api.open-meteo.com');
    expect(result).toMatchObject({ pressureHpa: 1000 });
  });

  it('returns null instead of throwing when the network request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const result = await fetchWeatherForDate(52.2, 21.0, toISODate(new Date()));
    expect(result).toBeNull();
  });
});
