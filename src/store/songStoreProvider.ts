import { useSupabaseSongStore } from './supabaseSongStore';
import { isSupabaseConfigured } from '../supabase/config'; // Keep for potential future use or logging

// Always use Supabase store
export const useSongStoreProvider = useSupabaseSongStore;

// Export the storage connection test function from the Supabase store
export const testStorageConnection = async () => {
  // Check if Supabase is configured before attempting to import and run test
  if (isSupabaseConfigured) {
    const supabaseStore = await import('./supabaseSongStore');
    return supabaseStore.testStorageConnection();
  } else {
    console.warn('[SongStoreProvider] Supabase not configured. Storage connection test skipped.');
    // Return a promise that resolves to true or false based on your desired default behavior
    return Promise.resolve(false); 
  }
}; 