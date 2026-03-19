import React, { useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Database,
  Download,
  Flag,
  Info,
  Play,
  Search as SearchIcon,
  StopCircle,
  User,
  XCircle,
} from 'lucide-react';
import {
  ImportProgress,
  importAllSeasons,
  importSeason,
  importSingleDriver,
  importSingleRace,
  searchDrivers,
} from '../../lib/ergast';

const defaultProgress = (): ImportProgress => ({
  total: 0,
  done: 0,
  logs: [],
  drivers: 0,
  constructors: 0,
  races: 0,
  results: 0,
});

type Toast = { type: 'success' | 'error' | 'info'; message: string };

export default function AdminImport() {
  const [progress, setProgress] = useState<ImportProgress>(defaultProgress());
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Single import state
  const [driverQuery, setDriverQuery] = useState('');
  const [driverMatches, setDriverMatches] = useState<any[]>([]);
  const [singleYear, setSingleYear] = useState(String(new Date().getFullYear()));
  const [singleRound, setSingleRound] = useState('1');
  const [resyncSingle, setResyncSingle] = useState(false);

  // Bulk import state
  const [bulkYear, setBulkYear] = useState(String(new Date().getFullYear()));
  const [resyncBulk, setResyncBulk] = useState(false);

  const start = async (fn: (onP: typeof setProgress, signal: AbortSignal) => Promise<void>) => {
    setProgress(defaultProgress());
    setToast(null);
    setRunning(true);
    abortRef.current = new AbortController();
    try {
      await fn(setProgress, abortRef.current.signal);
      if (!abortRef.current.signal.aborted) setToast({ type: 'success', message: 'Import complete' });
    } catch (err: any) {
      setProgress(p => ({ ...p, logs: [{ type: 'error', message: err.message }, ...p.logs] }));
      setToast({ type: 'error', message: err.message || 'Import failed' });
    } finally {
      setRunning(false);
    }
  };

  const cancel = () => abortRef.current?.abort();
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const canSearchDriver = useMemo(() => driverQuery.trim().length > 0 && !running, [driverQuery, running]);

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <div
            className={
              'px-4 py-3 rounded-2xl border text-sm font-bold shadow-xl backdrop-blur ' +
              (toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : toast.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300')
            }
          >
            {toast.message}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Import Data</h1>
        <p className="text-gray-400">Sync F1 data from the Ergast / Jolpica API into Supabase.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Import */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Download className="w-5 h-5 text-red-500" /> Single Import
          </h2>

          {/* Driver */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase font-bold">Driver name or ID</label>
            <div className="flex gap-2">
              <input
                value={driverQuery}
                onChange={e => {
                  setDriverQuery(e.target.value);
                  setDriverMatches([]);
                }}
                placeholder="hamilton or Lewis Hamilton"
                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <button
                disabled={!canSearchDriver}
                onClick={() =>
                  start(async (onP, sig) => {
                    onP(p => ({
                      ...p,
                      logs: [{ type: 'info', message: `Searching drivers: ${driverQuery}` }, ...p.logs],
                    }));
                    const matches = await searchDrivers(driverQuery, { signal: sig });
                    setDriverMatches(matches);
                    onP(p => ({
                      ...p,
                      logs: [{ type: 'success', message: `Found ${matches.length} matching drivers` }, ...p.logs],
                    }));
                  })
                }
                className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                <SearchIcon className="w-4 h-4" /> Search
              </button>
              <button
                disabled={running || !driverQuery.trim()}
                onClick={() =>
                  start(async (onP, sig) => {
                    onP(p => ({
                      ...p,
                      logs: [{ type: 'info', message: `Importing driver: ${driverQuery}` }, ...p.logs],
                    }));
                    const imported = await importSingleDriver(driverQuery, { signal: sig });
                    onP(p => ({
                      ...p,
                      drivers: 1,
                      logs: [{ type: 'success', message: `✓ Driver imported (${imported.driverId})` }, ...p.logs],
                    }));
                  })
                }
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                <User className="w-4 h-4" /> Import Driver
              </button>
            </div>

            {driverMatches.length > 0 && (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3 space-y-2">
                <p className="text-xs text-gray-500">Select a driver to import:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {driverMatches.map(d => (
                    <div
                      key={d.driverId}
                      className="flex items-center justify-between gap-3 bg-black/40 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {d.givenName} {d.familyName}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {d.driverId} • {d.nationality}
                        </p>
                      </div>
                      <button
                        disabled={running}
                        onClick={() =>
                          start(async (onP, sig) => {
                            onP(p => ({
                              ...p,
                              logs: [{ type: 'info', message: `Importing driver: ${d.driverId}` }, ...p.logs],
                            }));
                            await importSingleDriver(d.driverId, { signal: sig });
                            onP(p => ({
                              ...p,
                              drivers: 1,
                              logs: [{ type: 'success', message: `✓ Driver imported (${d.driverId})` }, ...p.logs],
                            }));
                          })
                        }
                        className="shrink-0 flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        <User className="w-4 h-4" /> Import
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Race */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase font-bold">Race (Year + Round)</label>
            <div className="flex gap-2">
              <input
                value={singleYear}
                onChange={e => setSingleYear(e.target.value)}
                placeholder="2023"
                className="w-24 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <input
                value={singleRound}
                onChange={e => setSingleRound(e.target.value)}
                placeholder="1"
                className="w-20 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <button
                disabled={running}
                onClick={() =>
                  start((onP, sig) =>
                    importSingleRace(parseInt(singleYear), parseInt(singleRound), onP, sig, {
                      resync: resyncSingle,
                    })
                  )
                }
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                <Flag className="w-4 h-4" /> Import Race
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-400 font-bold select-none">
            <input
              type="checkbox"
              checked={resyncSingle}
              onChange={e => setResyncSingle(e.target.checked)}
              disabled={running}
              className="accent-red-600"
            />
            Re-sync (overwrite imported results)
          </label>

          {/* Season */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase font-bold">Full Season</label>
            <div className="flex gap-2">
              <input
                value={singleYear}
                onChange={e => setSingleYear(e.target.value)}
                placeholder="2023"
                className="w-28 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <button
                disabled={running}
                onClick={() =>
                  start((onP, sig) => importSeason(parseInt(singleYear), onP, sig, { resync: resyncSingle }))
                }
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                <Calendar className="w-4 h-4" /> Import Season
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Import */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-red-500" /> Bulk Import
          </h2>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase font-bold">Season Year</label>
            <div className="flex gap-2">
              <input
                value={bulkYear}
                onChange={e => setBulkYear(e.target.value)}
                placeholder="2023"
                className="w-28 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <button
                disabled={running}
                onClick={() => start((onP, sig) => importSeason(parseInt(bulkYear), onP, sig, { resync: resyncBulk }))}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                <Play className="w-4 h-4" /> Import Full Season
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-400 font-bold select-none">
            <input
              type="checkbox"
              checked={resyncBulk}
              onChange={e => setResyncBulk(e.target.checked)}
              disabled={running}
              className="accent-red-600"
            />
            Re-sync (overwrite imported results)
          </label>

          <div className="border-t border-white/5 pt-4">
            <p className="text-xs text-gray-500 mb-3">Import every season from 1950 to present. This will take several minutes.</p>
            <button
              disabled={running}
              onClick={() => start((onP, sig) => importAllSeasons(onP, sig, { resync: resyncBulk }))}
              className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              <Database className="w-4 h-4" /> Import All Seasons (1950–present)
            </button>
          </div>

          {running && (
            <button
              onClick={cancel}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold transition-all"
            >
              <StopCircle className="w-4 h-4" /> Cancel Import
            </button>
          )}
        </div>
      </div>

      {/* Import Status */}
      {(running || progress.logs.length > 0) && (
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Import Status</h2>
            {running && <span className="text-xs text-yellow-400 font-bold animate-pulse">● Running...</span>}
            {!running && progress.logs.length > 0 && <span className="text-xs text-green-400 font-bold">● Done</span>}
          </div>

          {/* Progress bar */}
          {progress.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {progress.done} / {progress.total} races
                </span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Drivers', value: progress.drivers },
              { label: 'Constructors', value: progress.constructors },
              { label: 'Races', value: progress.races },
              { label: 'Results', value: progress.results },
            ].map(s => (
              <div key={s.label} className="bg-black/40 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Logs */}
          <div className="bg-black/60 rounded-2xl p-4 h-56 overflow-y-auto space-y-1 font-mono text-xs">
            {progress.logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />}
                {log.type === 'error' && <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />}
                {log.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />}
                <span
                  className={
                    log.type === 'success'
                      ? 'text-green-300'
                      : log.type === 'error'
                        ? 'text-red-300'
                        : 'text-gray-400'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
