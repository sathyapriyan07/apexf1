export interface Driver {
  id: string;
  name: string;
  nationality: string;
  dob: string;
  image_url: string;
  bio?: string;
}

export interface Constructor {
  id: string;
  name: string;
  logo_url: string;
  history?: string;
}

export interface Season {
  id: string;
  year: number;
  image_url?: string;
  champion_driver_id?: string;
  champion_constructor_id?: string;
  champion_driver?: Driver;
  champion_constructor?: Constructor;
  published: boolean;
}

export interface Race {
  id: string;
  season_id: string;
  name: string;
  circuit: string;
  date: string;
  image_url: string;
  youtube_url?: string;
  season?: Season;
}

export interface Result {
  id: string;
  race_id: string;
  driver_id: string;
  constructor_id: string;
  position: number;
  points: number;
  grid: number;
  fastest_lap: boolean;
  driver?: Driver;
  constructor?: Constructor;
  race?: Race;
}

export interface UserProfile {
  id: string;
  role: 'admin' | 'user';
}
