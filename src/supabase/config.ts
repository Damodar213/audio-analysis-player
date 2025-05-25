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
    console.warn('Supabase client not initialized. Using test mode.');
    return false;
  }
  
  try {
    // Check if the bucket exists, create it if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === SONGS_BUCKET);
    
    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(SONGS_BUCKET, {
        public: true, // Make files publicly accessible
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit per file
      });
      
      if (error) {
        console.error('Error creating Supabase storage bucket:', error);
      } else {
        console.log('Created Supabase storage bucket:', data);
      }
    } else {
      // Update bucket settings
      const { error } = await supabase.storage.updateBucket(SONGS_BUCKET, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024,
      });
      
      if (error) {
        console.error('Error updating bucket settings:', error);
      } else {
        console.log('Updated bucket settings successfully');
      }
    }
    
    console.log('Supabase storage initialized successfully');
    return true;
  } catch (err) {
    console.error('Error initializing Supabase storage:', err);
    return false;
  }
}; 