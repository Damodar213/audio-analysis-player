import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Storage bucket name for songs
export const SONGS_BUCKET = 'songs';

// Create a Supabase client only if valid credentials are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = !!supabase;

// Initialize the storage bucket
export const initializeStorage = async () => {
  if (!supabase) {
    console.warn('[initializeStorage] Supabase client not initialized. Cannot check bucket.');
    return false;
  }
  
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('[initializeStorage] Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === SONGS_BUCKET);
    
    if (bucketExists) {
      console.log(`[initializeStorage] Storage bucket '${SONGS_BUCKET}' found.`);
      return true;
    } else {
      console.warn(`[initializeStorage] Storage bucket '${SONGS_BUCKET}' NOT found. Please create it manually in the Supabase dashboard.`);
      return false; // Or true if you want the app to proceed, but uploads will fail.
    }
  } catch (err) {
    console.error('[initializeStorage] Error checking Supabase storage:', err);
    return false;
  }
}; 