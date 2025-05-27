export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  year?: number;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: number;
  genres: Genre[];
  analyzed: boolean;
  coverArt?: string;
  duration?: number;
}

export interface Genre {
  name: string;
  confidence: number;
}

export interface AnalysisResult {
  songId: string;
  genres: Genre[];
  features?: {
    tempo?: number;
    key?: string;
    energy?: number;
    danceability?: number;
    acousticness?: number;
  };
  timestamp: number;
}

export type ThemeMode = 'light' | 'dark';