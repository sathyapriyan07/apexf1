-- F1 Archive Database Schema

-- 1. Profiles table (for roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  dob DATE NOT NULL,
  image_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Constructors table
CREATE TABLE IF NOT EXISTS public.constructors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Seasons table
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  image_url TEXT,
  champion_driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  champion_constructor_id TEXT REFERENCES public.constructors(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Races table
CREATE TABLE IF NOT EXISTS public.races (
  id TEXT PRIMARY KEY,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  circuit TEXT NOT NULL,
  date DATE NOT NULL,
  image_url TEXT,
  youtube_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Results table
CREATE TABLE IF NOT EXISTS public.results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id TEXT REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  constructor_id TEXT REFERENCES public.constructors(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL, -- 0 for DNF
  points NUMERIC DEFAULT 0 NOT NULL,
  grid INTEGER NOT NULL,
  fastest_lap BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Prevent duplicate results per race/driver (enables safe upserts)
CREATE UNIQUE INDEX IF NOT EXISTS results_race_driver_unique
  ON public.results (race_id, driver_id);

-- View for driver standings
CREATE OR REPLACE VIEW public.driver_standings AS
SELECT 
  s.id as season_id,
  d.id as driver_id,
  d.name as driver_name,
  c.name as constructor_name,
  SUM(r.points) as total_points,
  COUNT(CASE WHEN r.position = 1 THEN 1 END) as wins
FROM public.results r
JOIN public.drivers d ON r.driver_id = d.id
JOIN public.races ra ON r.race_id = ra.id
JOIN public.seasons s ON ra.season_id = s.id
LEFT JOIN public.constructors c ON r.constructor_id = c.id
GROUP BY s.id, d.id, d.name, c.name
ORDER BY s.id, total_points DESC;

-- View for all-time driver records
CREATE OR REPLACE VIEW public.all_time_records AS
SELECT 
  d.id as driver_id,
  d.name as driver_name,
  d.image_url as driver_image_url,
  d.nationality as driver_nationality,
  COUNT(CASE WHEN r.position = 1 THEN 1 END) as wins,
  COUNT(CASE WHEN r.position >= 1 AND r.position <= 3 THEN 1 END) as podiums,
  COUNT(CASE WHEN r.grid = 1 THEN 1 END) as poles,
  SUM(r.points) as total_points
FROM public.results r
JOIN public.drivers d ON r.driver_id = d.id
GROUP BY d.id, d.name, d.image_url, d.nationality
ORDER BY wins DESC;

-- Driver career span (first/last season year)
CREATE OR REPLACE VIEW public.driver_career_span AS
SELECT
  r.driver_id,
  MIN(s.year) AS start_year,
  MAX(s.year) AS end_year
FROM public.results r
JOIN public.races ra ON ra.id = r.race_id
JOIN public.seasons s ON s.id = ra.season_id
GROUP BY r.driver_id;

-- Latest team (constructor) per driver based on most recent race date
CREATE OR REPLACE VIEW public.driver_latest_team AS
SELECT DISTINCT ON (r.driver_id)
  r.driver_id,
  c.id AS constructor_id,
  c.name AS constructor_name,
  c.logo_url AS constructor_logo_url
FROM public.results r
JOIN public.races ra ON ra.id = r.race_id
JOIN public.constructors c ON c.id = r.constructor_id
ORDER BY r.driver_id, ra.date DESC;

-- Driver card view used by the UI (joins stats + career span + latest team)
CREATE OR REPLACE VIEW public.driver_cards AS
SELECT
  d.id AS driver_id,
  d.name,
  d.nationality,
  d.image_url,
  COALESCE(rec.wins, 0) AS wins,
  COALESCE(rec.total_points, 0) AS points,
  span.start_year,
  span.end_year,
  lt.constructor_name AS team,
  lt.constructor_logo_url AS team_logo_url
FROM public.drivers d
LEFT JOIN public.all_time_records rec ON rec.driver_id = d.id
LEFT JOIN public.driver_career_span span ON span.driver_id = d.id
LEFT JOIN public.driver_latest_team lt ON lt.driver_id = d.id;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Policies
-- Make this script re-runnable (avoids "policy already exists" errors)
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.drivers;
DROP POLICY IF EXISTS "Public read access" ON public.constructors;
DROP POLICY IF EXISTS "Public read access" ON public.seasons;
DROP POLICY IF EXISTS "Public read access" ON public.races;
DROP POLICY IF EXISTS "Public read access" ON public.results;

DROP POLICY IF EXISTS "Admin write access" ON public.drivers;
DROP POLICY IF EXISTS "Admin write access" ON public.constructors;
DROP POLICY IF EXISTS "Admin write access" ON public.seasons;
DROP POLICY IF EXISTS "Admin write access" ON public.races;
DROP POLICY IF EXISTS "Admin write access" ON public.results;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Public read access
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public read access" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.constructors FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.races FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.results FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admin write access" ON public.drivers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin write access" ON public.constructors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin write access" ON public.seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin write access" ON public.races FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin write access" ON public.results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profile update policy (users can update their own profile, but not role)
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grants (RLS still enforced)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.drivers, public.constructors, public.seasons, public.races, public.results TO anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE ON TABLE public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.drivers, public.constructors, public.seasons, public.races, public.results TO authenticated;
GRANT SELECT ON TABLE public.driver_standings, public.all_time_records, public.driver_career_span, public.driver_latest_team, public.driver_cards TO anon, authenticated;
