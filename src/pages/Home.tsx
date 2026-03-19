import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Hero from '../components/Hero';
import Card from '../components/Card';
import { Season, Driver, Race } from '../types';
import { motion } from 'framer-motion';

export default function Home() {
  const [featuredSeason, setFeaturedSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const timeout = setTimeout(() => setLoading(false), 5000);
      try {
        const [seasonsRes, driversRes, racesRes] = await Promise.all([
          supabase.from('seasons').select('*, champion_driver:drivers(*), champion_constructor:constructors(*)').eq('published', true).order('year', { ascending: false }).limit(6),
          supabase.from('drivers').select('*').limit(6),
          supabase.from('races').select('*, season:seasons(*)').order('date', { ascending: false }).limit(6)
        ]);

        if (seasonsRes.data) {
          setSeasons(seasonsRes.data);
          setFeaturedSeason(seasonsRes.data[0]);
        }
        if (driversRes.data) setDrivers(driversRes.data);
        if (racesRes.data) setRaces(racesRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen pb-20">
      {featuredSeason && (
        <Hero
          title={`${featuredSeason.year} Season`}
          subtitle="Featured Season"
          description={`Experience the thrill of the ${featuredSeason.year} Formula One World Championship. From legendary battles to historic victories.`}
          imageUrl="https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=1920"
          ctaLink={`/seasons/${featuredSeason.id}`}
          ctaText="Explore Season"
          secondaryCtaLink="/seasons"
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* Featured Seasons */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Featured Seasons</h2>
              <p className="text-gray-400 mt-1">Relive the most iconic years in F1 history.</p>
            </div>
            <a href="/seasons" className="text-red-500 font-semibold hover:underline">View All</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {seasons.map((season) => (
              <Card
                key={season.id}
                title={`${season.year} Season`}
                subtitle={season.champion_driver ? `Champion: ${season.champion_driver.name}` : 'TBD'}
                imageUrl="https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800"
                href={`/seasons/${season.id}`}
              />
            ))}
          </div>
        </section>

        {/* Popular Drivers */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Popular Drivers</h2>
              <p className="text-gray-400 mt-1">The legends who defined the sport.</p>
            </div>
            <a href="/drivers" className="text-red-500 font-semibold hover:underline">View All</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {drivers.map((driver) => (
              <Card
                key={driver.id}
                title={driver.name}
                subtitle={driver.nationality}
                imageUrl={driver.image_url || "https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=400"}
                href={`/drivers/${driver.id}`}
                aspectRatio="portrait"
              />
            ))}
          </div>
        </section>

        {/* Recent Races */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Legendary Races</h2>
              <p className="text-gray-400 mt-1">Unforgettable moments on the track.</p>
            </div>
            <a href="/search" className="text-red-500 font-semibold hover:underline">Search Races</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {races.map((race) => (
              <Card
                key={race.id}
                title={race.name}
                subtitle={`${race.circuit} • ${new Date(race.date).getFullYear()}`}
                imageUrl={race.image_url || "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800"}
                href={`/races/${race.id}`}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
