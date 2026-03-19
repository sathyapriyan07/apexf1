import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const ERGAST_BASE = 'https://ergast.com/api/f1';
const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const BASES = [ERGAST_BASE, JOLPICA_BASE] as const;

type ImportOptions = {
  resync: boolean;
  publish: boolean;
  fromYear: number;
  toYear: number;
  singleYear?: number;
  raceDelayMs: number;
};

function parseArgs(argv: string[]): ImportOptions {
  const get = (flag: string) => {
    const idx = argv.indexOf(flag);
    if (idx === -1) return null;
    return argv[idx + 1] ?? null;
  };

  const resync = argv.includes('--resync');
  const publish = argv.includes('--publish');
  const raceDelayMs = Number(get('--delay') ?? '300') || 300;

  const singleYearRaw = get('--season');
  const fromRaw = get('--from');
  const toRaw = get('--to');

  const currentYear = new Date().getFullYear();
  const fromYear = Number(fromRaw ?? '1950') || 1950;
  const toYear = Number(toRaw ?? String(currentYear)) || currentYear;
  const singleYear = singleYearRaw ? Number(singleYearRaw) : undefined;

  return { resync, publish, fromYear, toYear, singleYear, raceDelayMs };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function apiFetch(path: string) {
  let lastErr: unknown = null;
  for (const base of BASES) {
    try {
      const res = await fetch(`${base}${path}`, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (!contentType.includes('application/json')) {
        throw new Error(`Non-JSON response (${contentType || 'unknown content-type'})`);
      }
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Failed to fetch ${path} (Ergast + Jolpica): ${String((lastErr as any)?.message ?? lastErr)}`);
}

function withPagination(path: string, limit: number, offset: number) {
  const hasQuery = path.includes('?');
  const base = hasQuery ? `${path}&` : `${path}?`;
  return `${base}limit=${limit}&offset=${offset}`;
}

function pick(obj: any, keys: string[]) {
  for (const k of keys) if (obj?.[k] != null) return obj[k];
  return undefined;
}

function uniqueBy<T>(items: T[], key: (t: T) => string) {
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

function transformDriver(d: any) {
  const driverId = pick(d, ['driverId', 'DriverId']);
  const givenName = pick(d, ['givenName', 'GivenName']);
  const familyName = pick(d, ['familyName', 'FamilyName']);
  const nationality = pick(d, ['nationality', 'Nationality']);
  const dateOfBirth = pick(d, ['dateOfBirth', 'DateOfBirth']);
  return {
    id: String(driverId ?? ''),
    name: `${String(givenName ?? '').trim()} ${String(familyName ?? '').trim()}`.trim(),
    nationality: nationality ?? 'Unknown',
    dob: dateOfBirth ?? '1900-01-01',
  };
}

function transformConstructor(c: any) {
  const constructorId = pick(c, ['constructorId', 'ConstructorId']);
  const name = pick(c, ['name', 'Name']);
  return { id: String(constructorId ?? ''), name: String(name ?? '').trim() };
}

function transformRace(r: any, seasonId: string) {
  const season = pick(r, ['season', 'Season']);
  const round = pick(r, ['round', 'Round']);
  const raceName = pick(r, ['raceName', 'RaceName']);
  const date = pick(r, ['date', 'Date']);
  const circuitName = pick(r?.Circuit, ['circuitName', 'CircuitName']);
  return {
    id: `${season}-${round}`,
    season_id: seasonId,
    name: String(raceName ?? '').trim(),
    circuit: circuitName ?? 'Unknown',
    date,
  };
}

function transformResult(res: any, raceId: string) {
  const position = pick(res, ['position', 'Position']);
  const points = pick(res, ['points', 'Points']);
  const grid = pick(res, ['grid', 'Grid']);
  const driver = pick(res, ['Driver', 'driver']);
  const constructor = pick(res, ['Constructor', 'constructor']);
  const driverId = pick(driver, ['driverId', 'DriverId']);
  const constructorId = pick(constructor, ['constructorId', 'ConstructorId']);
  const pos = parseInt(String(position ?? ''), 10);
  return {
    race_id: raceId,
    driver_id: String(driverId ?? ''),
    constructor_id: String(constructorId ?? ''),
    position: isNaN(pos) ? 0 : pos,
    points: parseFloat(String(points ?? '')) || 0,
    grid: parseInt(String(grid ?? ''), 10) || 0,
    fastest_lap: pick(res?.FastestLap, ['rank', 'Rank']) === '1',
  };
}

async function fetchSeasonSchedule(year: number) {
  const data = await apiFetch(withPagination(`/${year}.json`, 1000, 0));
  return (data?.MRData?.RaceTable?.Races ?? []) as any[];
}

async function fetchRaceResults(year: number, round: number) {
  const data = await apiFetch(withPagination(`/${year}/${round}/results.json`, 1000, 0));
  return (data?.MRData?.RaceTable?.Races?.[0] ?? null) as any | null;
}

async function fetchSeasonChampions(year: number) {
  const [driverStandings, constructorStandings] = await Promise.all([
    apiFetch(withPagination(`/${year}/driverStandings.json`, 1000, 0)),
    apiFetch(withPagination(`/${year}/constructorStandings.json`, 1000, 0)),
  ]);

  const championDriverId =
    driverStandings?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0]?.Driver?.driverId ?? null;
  const championConstructorId =
    constructorStandings?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings?.[0]?.Constructor
      ?.constructorId ?? null;

  return { championDriverId: championDriverId as string | null, championConstructorId: championConstructorId as string | null };
}

async function fetchDriverById(driverId: string) {
  const data = await apiFetch(withPagination(`/drivers/${driverId}.json`, 1000, 0));
  return (data?.MRData?.DriverTable?.Drivers?.[0] ?? null) as any | null;
}

async function fetchConstructorById(constructorId: string) {
  const data = await apiFetch(withPagination(`/constructors/${constructorId}.json`, 1000, 0));
  return (data?.MRData?.ConstructorTable?.Constructors?.[0] ?? null) as any | null;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing env. Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (service role) in your environment.'
    );
  }

  if (serviceRoleKey.startsWith('sb_publishable_')) {
    throw new Error(
      'You are using a publishable (anon) key. For terminal imports, set SUPABASE_SERVICE_ROLE_KEY to your Supabase secret/service_role key (sb_secret_...).'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const years =
    typeof opts.singleYear === 'number'
      ? [opts.singleYear]
      : Array.from({ length: opts.toYear - opts.fromYear + 1 }, (_, i) => opts.fromYear + i);

  console.log(`Import starting: years=${years[0]}..${years[years.length - 1]} resync=${opts.resync} delay=${opts.raceDelayMs}ms`);

  for (const year of years) {
    console.log(`\n=== Season ${year} ===`);

    // Ensure season row exists
    const existing = await supabase.from('seasons').select('id, published').eq('year', year).maybeSingle();
    if (existing.error) throw existing.error;

    let seasonId: string;
    if (existing.data?.id) {
      seasonId = existing.data.id;
      if (opts.publish && existing.data.published !== true) {
        await supabase.from('seasons').update({ published: true }).eq('id', seasonId);
      }
    } else {
      const inserted = await supabase
        .from('seasons')
        .insert({ year, published: opts.publish })
        .select('id')
        .single();
      if (inserted.error) throw inserted.error;
      seasonId = inserted.data.id;
    }

    // Champions (best-effort)
    try {
      const { championDriverId, championConstructorId } = await fetchSeasonChampions(year);
      // Ensure referenced rows exist before setting FK fields
      if (championDriverId) {
        const d = await fetchDriverById(championDriverId);
        if (d) {
          const up = await supabase.from('drivers').upsert([transformDriver(d)], { onConflict: 'id' });
          if (up.error) throw up.error;
        }
      }
      if (championConstructorId) {
        const c = await fetchConstructorById(championConstructorId);
        if (c) {
          const up = await supabase.from('constructors').upsert([transformConstructor(c)], { onConflict: 'id' });
          if (up.error) throw up.error;
        }
      }

      const patch: any = {};
      if (championDriverId) patch.champion_driver_id = championDriverId;
      if (championConstructorId) patch.champion_constructor_id = championConstructorId;
      if (Object.keys(patch).length) {
        const up = await supabase.from('seasons').update(patch).eq('id', seasonId);
        if (up.error) throw up.error;
      }
    } catch (e) {
      console.log(`Champion sync skipped: ${String((e as any)?.message ?? e)}`);
    }

    const races = await fetchSeasonSchedule(year);
    console.log(`Races: ${races.length}`);

    let raceIndex = 0;
    for (const race of races) {
      raceIndex++;
      const round = parseInt(String(pick(race, ['round', 'Round']) ?? '0'), 10);
      const raceName = String(pick(race, ['raceName', 'RaceName']) ?? '');
      process.stdout.write(`- ${year} round ${round} (${raceIndex}/${races.length}) ${raceName} ... `);

      try {
        const raceData = await fetchRaceResults(year, round);
        const results: any[] = (raceData?.Results ?? []) as any[];

        const driverRows = uniqueBy(results.map(r => transformDriver(r.Driver ?? r.driver)), d => d.id);
        const constructorRows = uniqueBy(results.map(r => transformConstructor(r.Constructor ?? r.constructor)), c => c.id);

        if (driverRows.length) {
          const r = await supabase.from('drivers').upsert(driverRows, { onConflict: 'id' });
          if (r.error) throw r.error;
        }
        if (constructorRows.length) {
          const r = await supabase.from('constructors').upsert(constructorRows, { onConflict: 'id' });
          if (r.error) throw r.error;
        }

        const raceRow = transformRace(race, seasonId);
        const upRace = await supabase.from('races').upsert([raceRow], { onConflict: 'id' });
        if (upRace.error) throw upRace.error;

        const resultRows = results.map(r => transformResult(r, raceRow.id));
        if (opts.resync) {
          const del = await supabase.from('results').delete().eq('race_id', raceRow.id);
          if (del.error) throw del.error;
        }
        if (resultRows.length) {
          const upRes = await supabase.from('results').upsert(resultRows, { onConflict: 'race_id,driver_id' });
          if (upRes.error) throw upRes.error;
        }

        console.log(`ok (drivers=${driverRows.length} constructors=${constructorRows.length} results=${resultRows.length})`);
      } catch (e: any) {
        console.log(`failed: ${e?.message ?? String(e)}`);
      }

      await delay(opts.raceDelayMs);
    }
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
