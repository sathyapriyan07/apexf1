import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trophy, Gauge, CalendarRange } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface DriverCardProps {
  key?: string | number;
  name: string;
  team: string;
  image: string;
  banner: string;
  wins: number;
  seasons: string;
  points: number;
  id?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join('');
}

function readFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem('f1:favorites');
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter(x => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeFavorites(ids: Set<string>) {
  try {
    localStorage.setItem('f1:favorites', JSON.stringify(Array.from(ids)));
  } catch {}
}

export function DriverCard({
  id,
  name,
  team,
  image,
  banner,
  wins,
  seasons,
  points,
}: DriverCardProps) {
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(id ? readFavorites().has(id) : false);
  }, [id]);

  const onView = () => {
    if (!id) return;
    navigate(`/drivers/${id}`);
  };

  const toggleFav: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    if (!id) return;
    const favs = readFavorites();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    writeFavorites(favs);
    setIsFav(favs.has(id));
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onClick={onView}
      onKeyDown={(e) => {
        if (!id) return;
        if (e.key === 'Enter' || e.key === ' ') onView();
      }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl',
        id ? 'cursor-pointer' : 'cursor-default'
      )}
      role={id ? 'button' : undefined}
      tabIndex={id ? 0 : -1}
    >
      {/* Banner */}
      <div className="relative h-24">
        {banner ? (
          <img
            src={banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-black to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-black/10" />

        <button
          type="button"
          onClick={toggleFav}
          disabled={!id}
          title={id ? 'Favorite Driver' : 'Favorite Driver (needs id)'}
          className={cn(
            'absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 p-2 backdrop-blur transition-all',
            'hover:bg-black/60',
            !id && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Heart className={cn('h-4 w-4', isFav ? 'fill-red-500 text-red-500' : 'text-gray-300')} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-5">
        <div className="-mt-10 flex items-end justify-between gap-4">
          <div className="flex items-end gap-4 min-w-0">
            <div className="h-16 w-16 rounded-2xl border border-white/10 bg-black/40 overflow-hidden shrink-0">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white font-black">
                  {initials(name) || 'F1'}
                </div>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <p className="text-lg font-black text-white truncate">{name}</p>
              <p className="text-xs text-gray-400 font-bold truncate">{team || '—'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/40 border border-white/5 p-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
              <Trophy className="h-3.5 w-3.5 text-yellow-400" />
              Wins
            </div>
            <div className="mt-1 text-xl font-black text-white">{wins}</div>
          </div>
          <div className="rounded-2xl bg-black/40 border border-white/5 p-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
              <Gauge className="h-3.5 w-3.5 text-red-400" />
              Points
            </div>
            <div className="mt-1 text-xl font-black text-white">{Math.round(points)}</div>
          </div>
          <div className="rounded-2xl bg-black/40 border border-white/5 p-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
              <CalendarRange className="h-3.5 w-3.5 text-blue-400" />
              Seasons
            </div>
            <div className="mt-1 text-sm font-black text-white truncate" title={seasons}>
              {seasons || '—'}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            disabled={!id}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-black transition-all',
              id
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-zinc-700 text-gray-300 cursor-not-allowed'
            )}
          >
            View Profile
          </button>

          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            Favorite Driver
          </div>
        </div>
      </div>
    </motion.div>
  );
}
