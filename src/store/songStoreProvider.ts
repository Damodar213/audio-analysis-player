import { useSongStore } from './songStore';
import { useSupabaseSongStore } from './supabaseSongStore';
import { isSupabaseConfigured } from '../supabase/config';

// Set this to true to use Supabase instead of Firebase when Supabase is configured
// If Supabase is not configured, it will fall back to Firebase regardless
const USE_SUPABASE = true;

// Determine which store to use based on configuration and preference
const useSupabase = USE_SUPABASE && isSupabaseConfigured;

// Export the appropriate store based on the configuration
export const useSongStoreProvider = useSupabase ? useSupabaseSongStore : useSongStore;

// Export the storage connection test function from the appropriate store
export const testStorageConnection = useSupabase ? 
  (await import('./supabaseSongStore')).testStorageConnection : 
  (await import('./songStore')).testStorageConnection; 