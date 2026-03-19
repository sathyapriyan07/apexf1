import { supabase } from './supabase';

const BASE = 'https://ergast.com/api/f1';
const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const BASES = [BASE, JOLPICA] as const;

// Use a same-origin proxy by default (avoids CORS and enables server-side fallback).
const PROXY_BASE = '/api/f1';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type ApiFetchOptions = {
  signal?: AbortSignal;
  retries?: number;
};

type MrData = {
  total?: string;
  limit?: string;
  offset?: string;
  [k: string]: any;
};

function pickField(obj: any, keys: string[]) {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return undefined;
}

function withPagination(path: string, limit: number, offset: number) {
  const hasQuery = path.includes('?');
  const base = hasQuery ? `${path}&` : `${path}?`;
  return `${base}limit=${limit}&offset=${offset}`;
}

async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { signal, retries = 3 } = options;
  let lastError: unknown = null;

  // Try proxy first (works in dev via vite middleware; can be implemented in prod via rewrites/server).
  try {
    const proxied = await fetch(`${PROXY_BASE}${path}`, {
      signal,
      headers: { accept: 'application/json' },
    });
    if (proxied.ok) {
      const contentType = proxied.headers.get('content-type') || '';
      const text = await proxied.text();
      if (!contentType.includes('application/json')) {
        throw new Error(`Proxy returned non-JSON (${contentType || 'unknown content-type'})`);
      }
      return JSON.parse(text);
    }
    lastError = new Error(`Proxy HTTP ${proxied.status} ${proxied.statusText}`);
  } catch (err) {
    if ((err as any)?.name === 'AbortError') throw err;
    lastError = err;
  }

  for (let baseIndex = 0; baseIndex < BASES.length; baseIndex++) {
    const base = BASES[baseIndex];
    const isPrimary = baseIndex === 0;
    const baseRetries = isPrimary ? 1 : retries;

    for (let attempt = 1; attempt <= baseRetries; attempt++) {
      try {
        const res = await fetch(`${base}${path}`, {
          signal,
          headers: { accept: 'application/json' },
        });

        if (res.ok) return res.json();

        const body = await res.text().catch(() => '');
        const httpError = new Error(
          `HTTP ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ''}`
        );
        lastError = httpError;

        // If the primary is rate-limited / failing, immediately fall back to the mirror.
        if (isPrimary) break;

        // On mirror, retry on transient errors / rate limiting.
        if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
          const retryAfter = res.headers.get('retry-after');
          const waitMs = retryAfter
            ? Math.max(0, Number(retryAfter) * 1000)
            : Math.min(3000, 250 * Math.pow(2, attempt - 1));
          await delay(waitMs);
          continue;
        }

        throw httpError;
      } catch (err) {
        if ((err as any)?.name === 'AbortError') throw err;
        lastError = err;

        // If primary has a network/DNS failure, fall back to mirror immediately.
        if (isPrimary) break;

        await delay(Math.min(1500, 250 * Math.pow(2, attempt - 1)));
      }
    }
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error');
  throw new Error(`Failed to fetch ${path} (tried Ergast, then Jolpica): ${msg}`);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

// ---- Transformers ----

export function transformDriver(d: any) {
  // Ergast JSON typically uses lowerCamelCase, but accept doc-style keys too.
  const driverId = pickField(d, ['driverId', 'DriverId']);
  const givenName = pickField(d, ['givenName', 'GivenName']);
  const familyName = pickField(d, ['familyName', 'FamilyName']);
  const nationality = pickField(d, ['nationality', 'Nationality']);
  const dateOfBirth = pickField(d, ['dateOfBirth', 'DateOfBirth']);

  return {
    id: String(driverId ?? ''),
    name: `${String(givenName ?? '').trim()} ${String(familyName ?? '').trim()}`.trim(),
    nationality: nationality ?? 'Unknown',
    dob: dateOfBirth ?? '1900-01-01',
  };
}

export function transformConstructor(c: any) {
  const constructorId = pickField(c, ['constructorId', 'ConstructorId']);
  const name = pickField(c, ['name', 'Name']);

  return {
    id: String(constructorId ?? ''),
    name: String(name ?? '').trim(),
  };
}

export function transformRace(r: any, seasonId: string) {
  const season = pickField(r, ['season', 'Season']);
  const round = pickField(r, ['round', 'Round']);
  const raceName = pickField(r, ['raceName', 'RaceName']);
  const date = pickField(r, ['date', 'Date']);
  const circuitName = pickField(r?.Circuit, ['circuitName', 'CircuitName']);

  return {
    id: `${season}-${round}`,
    season_id: seasonId,
    name: String(raceName ?? '').trim(),
    circuit: circuitName ?? 'Unknown',
    date,
  };
}

export function transformResult(res: any, raceId: string) {
  const position = pickField(res, ['position', 'Position']);
  const points = pickField(res, ['points', 'Points']);
  const grid = pickField(res, ['grid', 'Grid']);

  const driver = pickField(res, ['Driver', 'driver']);
  const constructor = pickField(res, ['Constructor', 'constructor']);
  const driverId = pickField(driver, ['driverId', 'DriverId']);
  const constructorId = pickField(constructor, ['constructorId', 'ConstructorId']);

  const pos = parseInt(String(position ?? ''), 10);
  return {
    race_id: raceId,
    driver_id: String(driverId ?? ''),
    constructor_id: String(constructorId ?? ''),
    position: isNaN(pos) ? 0 : pos,
    points: parseFloat(String(points ?? '')) || 0,
    grid: parseInt(String(grid ?? ''), 10) || 0,
    fastest_lap: pickField(res?.FastestLap, ['rank', 'Rank']) === '1',
  };
}

// ---- Fetchers ----

export async function fetchSeason(year: number, options: ApiFetchOptions = {}) {
  const data = await apiFetch(withPagination(`/${year}.json`, 1000, 0), options);
  return data.MRData.RaceTable.Races as any[];
}

export async function fetchRaceResults(year: number, round: number, options: ApiFetchOptions = {}) {
  const data = await apiFetch(withPagination(`/${year}/${round}/results.json`, 1000, 0), options);
  return data.MRData.RaceTable.Races?.[0] as any;
}

export async function fetchDriver(driverId: string, options: ApiFetchOptions = {}) {
  const data = await apiFetch(withPagination(`/drivers/${driverId}.json`, 1000, 0), options);
  return data.MRData.DriverTable.Drivers?.[0] as any;
}

export async function fetchDrivers(year: number, options: ApiFetchOptions = {}) {
  const limit = 1000;
  let offset = 0;
  let all: any[] = [];

  while (true) {
    const data = await apiFetch(withPagination(`/${year}/drivers.json`, limit, offset), options);
    const mr: MrData = data?.MRData ?? {};
    const drivers = data?.MRData?.DriverTable?.Drivers ?? [];
    all = all.concat(drivers);
    const total = parseInt(String(mr.total ?? all.length), 10) || all.length;
    offset += limit;
    if (all.length >= total || drivers.length === 0) break;
  }

  return all as any[];
}

export async function fetchConstructors(year: number, options: ApiFetchOptions = {}) {
  const limit = 1000;
  let offset = 0;
  let all: any[] = [];

  while (true) {
    const data = await apiFetch(withPagination(`/${year}/constructors.json`, limit, offset), options);
    const mr: MrData = data?.MRData ?? {};
    const constructors = data?.MRData?.ConstructorTable?.Constructors ?? [];
    all = all.concat(constructors);
    const total = parseInt(String(mr.total ?? all.length), 10) || all.length;
    offset += limit;
    if (all.length >= total || constructors.length === 0) break;
  }

  return all as any[];
}

async function fetchDriversPage(limit: number, offset: number, options: ApiFetchOptions = {}) {
  const data = await apiFetch(withPagination(`/drivers.json`, limit, offset), options);
  const drivers = (data?.MRData?.DriverTable?.Drivers ?? []) as any[];
  const total = parseInt(String(data?.MRData?.total ?? drivers.length), 10) || drivers.length;
  return { drivers, total };
}

export async function searchDrivers(query: string, options: ApiFetchOptions = {}) {
  const q = normalizeText(query);
  if (!q) return [];

  const limit = 1000;
  let offset = 0;
  let all: any[] = [];

  while (true) {
    const { drivers, total } = await fetchDriversPage(limit, offset, options);
    all = all.concat(drivers);
    offset += limit;
    if (all.length >= total || drivers.length === 0) break;
  }

  const scored = all
    .map(d => {
      const id = String(d.driverId ?? '');
      const name = `${d.givenName ?? ''} ${d.familyName ?? ''}`.trim();
      const hayNorm = normalizeText(`${id} ${name} ${d.nationality ?? ''}`);
      const score =
        hayNorm === q ? 0 :
        hayNorm.startsWith(q) ? 1 :
        hayNorm.includes(q) ? 2 :
        99;
      return { d, score, name };
    })
    .filter(x => x.score < 99)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, 20)
    .map(x => x.d);

  return scored;
}

export async function fetchSeasonChampions(year: number, options: ApiFetchOptions = {}) {
  const [driverStandings, constructorStandings] = await Promise.all([
    apiFetch(withPagination(`/${year}/driverStandings.json`, 1000, 0), options),
    apiFetch(withPagination(`/${year}/constructorStandings.json`, 1000, 0), options),
  ]);

  const championDriverId =
    driverStandings?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0]?.Driver?.driverId ?? null;
  const championConstructorId =
    constructorStandings?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings?.[0]?.Constructor?.constructorId ?? null;

  return {
    championDriverId: championDriverId as string | null,
    championConstructorId: championConstructorId as string | null,
  };
}

export async function fetchAllRounds(year: number, options: ApiFetchOptions = {}) {
  const races = await fetchSeason(year, options);
  return races.map(r => parseInt(String(pickField(r, ['round', 'Round']) ?? '0'), 10)).filter(n => n > 0);
}

// ---- Upsert helpers ----

async function upsertBatch(table: string, rows: any[], options: { onConflict: string }) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + 100), {
      onConflict: options.onConflict,
    });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

// ---- High-level import functions ----

export interface ImportLog {
  type: 'info' | 'success' | 'error';
  message: string;
}

export interface ImportProgress {
  total: number;
  done: number;
  logs: ImportLog[];
  drivers: number;
  constructors: number;
  races: number;
  results: number;
}

type OnProgress = (p: ImportProgress) => void;

export async function importSeason(
  year: number,
  onProgress: OnProgress,
  signal?: AbortSignal,
  options: {
    resync?: boolean;
    updateChampions?: boolean;
    raceDelayMs?: number;
  } = {}
) {
  const { resync = false, updateChampions = true, raceDelayMs = 300 } = options;
  const progress: ImportProgress = {
    total: 0,
    done: 0,
    logs: [],
    drivers: 0,
    constructors: 0,
    races: 0,
    results: 0,
  };

  const log = (type: ImportLog['type'], message: string) => {
    progress.logs = [{ type, message }, ...progress.logs].slice(0, 200);
    onProgress({ ...progress });
  };

  log('info', `Fetching ${year} season schedule...`);

  // Ensure season row exists
  const { data: existingSeason } = await supabase
    .from('seasons')
    .select('id, champion_driver_id, champion_constructor_id')
    .eq('year', year)
    .single();

  let seasonId: string;
  if (existingSeason) {
    seasonId = existingSeason.id;
  } else {
    const { data: newSeason, error } = await supabase
      .from('seasons')
      .insert({ year, published: false })
      .select('id')
      .single();
    if (error) throw new Error(`Season insert: ${error.message}`);
    seasonId = newSeason!.id;
  }

  if (updateChampions) {
    try {
      const shouldUpdate =
        resync || (!existingSeason?.champion_driver_id && !existingSeason?.champion_constructor_id);
      if (shouldUpdate) {
        const { championDriverId, championConstructorId } = await fetchSeasonChampions(year, { signal });
        const patch: any = {};
        if (championDriverId) patch.champion_driver_id = championDriverId;
        if (championConstructorId) patch.champion_constructor_id = championConstructorId;
        if (Object.keys(patch).length) {
          const { error } = await supabase.from('seasons').update(patch).eq('id', seasonId);
          if (error) throw new Error(error.message);
          log('success', `Updated ${year} season champions`);
        }
      }
    } catch (err: any) {
      log('error', `Champion sync failed: ${err.message}`);
    }
  }

  const races = await fetchSeason(year, { signal });
  progress.total = races.length;
  log('success', `Found ${races.length} races in ${year}`);
  onProgress({ ...progress });

  for (const race of races) {
    if (signal?.aborted) {
      log('error', 'Import cancelled');
      break;
    }

    const round = parseInt(race.round, 10);
    log('info', `Round ${round}: ${race.raceName}`);

    try {
      const raceData = await fetchRaceResults(year, round, { signal });
      const results: any[] = raceData?.Results ?? [];

      const drivers = uniqueBy(results.map(r => transformDriver(r.Driver ?? r.driver)), d => d.id);
      const constructors = uniqueBy(results.map(r => transformConstructor(r.Constructor ?? r.constructor)), c => c.id);

      await upsertBatch('drivers', drivers, { onConflict: 'id' });
      await upsertBatch('constructors', constructors, { onConflict: 'id' });
      progress.drivers += drivers.length;
      progress.constructors += constructors.length;

      const raceRow = transformRace(race, seasonId);
      await upsertBatch('races', [raceRow], { onConflict: 'id' });
      progress.races += 1;

      if (results.length) {
        const resultRows = results.map(r => transformResult(r, raceRow.id));
        if (resync) {
          await supabase.from('results').delete().eq('race_id', raceRow.id);
        }
        await upsertBatch('results', resultRows, { onConflict: 'race_id,driver_id' });
        progress.results += resultRows.length;
      }

      log('success', `✓ Round ${round} — ${results.length} results`);
    } catch (err: any) {
      log('error', `✗ Round ${round}: ${err.message}`);
    }

    progress.done += 1;
    onProgress({ ...progress });
    await delay(raceDelayMs);
  }

  log('success', `Season ${year} import complete!`);
  onProgress({ ...progress });
}

export async function importAllSeasons(
  onProgress: OnProgress,
  signal?: AbortSignal,
  options: { resync?: boolean; updateChampions?: boolean } = {}
) {
  const currentYear = new Date().getFullYear();
  for (let year = 1950; year <= currentYear; year++) {
    if (signal?.aborted) break;
    await importSeason(year, onProgress, signal, options);
    await delay(500);
  }
}

export async function importSingleDriver(driverInput: string, options: ApiFetchOptions = {}) {
  const input = driverInput.trim();
  if (!input) throw new Error('Driver input required');

  // Try as driverId first
  const direct = await fetchDriver(input, options).catch(() => null);
  if (direct) {
    await upsertBatch('drivers', [transformDriver(direct)], { onConflict: 'id' });
    return { driverId: direct.driverId as string, driver: direct };
  }

  // Fall back to name search
  const matches = await searchDrivers(input, options);
  if (matches.length === 0) throw new Error('No drivers matched your search');
  if (matches.length > 1) {
    const suggestions = matches.slice(0, 5).map(d => d.driverId).join(', ');
    throw new Error(`Multiple matches. Use a driverId (e.g. ${suggestions})`);
  }

  const d = matches[0];
  await upsertBatch('drivers', [transformDriver(d)], { onConflict: 'id' });
  return { driverId: d.driverId as string, driver: d };
}

export async function importSingleRace(
  year: number,
  round: number,
  onProgress: OnProgress,
  signal?: AbortSignal,
  options: { resync?: boolean } = {}
) {
  const { resync = false } = options;
  const progress: ImportProgress = { total: 1, done: 0, logs: [], drivers: 0, constructors: 0, races: 0, results: 0 };

  const log = (type: ImportLog['type'], message: string) => {
    progress.logs = [{ type, message }, ...progress.logs].slice(0, 200);
    onProgress({ ...progress });
  };

  log('info', `Fetching ${year} round ${round}...`);

  const { data: existingSeason } = await supabase.from('seasons').select('id').eq('year', year).single();
  let seasonId: string;
  if (existingSeason) {
    seasonId = existingSeason.id;
  } else {
    const { data: newSeason, error } = await supabase
      .from('seasons')
      .insert({ year, published: false })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    seasonId = newSeason!.id;
  }

  const races = await fetchSeason(year, { signal });
  const raceInfo = races.find((r: any) => parseInt(r.round, 10) === round);
  if (!raceInfo) throw new Error(`Round ${round} not found in ${year}`);

  const raceData = await fetchRaceResults(year, round, { signal });
  const results: any[] = raceData?.Results ?? [];

  await upsertBatch('drivers', uniqueBy(results.map(r => transformDriver(r.Driver ?? r.driver)), d => d.id), { onConflict: 'id' });
  await upsertBatch('constructors', uniqueBy(results.map(r => transformConstructor(r.Constructor ?? r.constructor)), c => c.id), { onConflict: 'id' });

  const raceRow = transformRace(raceInfo, seasonId);
  await upsertBatch('races', [raceRow], { onConflict: 'id' });

  if (resync) {
    await supabase.from('results').delete().eq('race_id', raceRow.id);
  }
  if (results.length) {
    await upsertBatch('results', results.map(r => transformResult(r, raceRow.id)), { onConflict: 'race_id,driver_id' });
  }

  progress.done = 1;
  progress.drivers = results.length;
  progress.constructors = uniqueBy(results.map(r => transformConstructor(r.Constructor)), c => c.id).length;
  progress.races = 1;
  progress.results = results.length;
  log('success', `✓ Imported ${raceInfo.raceName} (${results.length} results)`);
  onProgress({ ...progress });
}
