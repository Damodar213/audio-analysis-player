import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase, SONGS_BUCKET, initializeStorage } from '../supabase/config';
import { Song, Genre } from '../types';
import { simulateGenreAnalysis } from '../utils/genreAnalysis';

// Sample song data for testing mode
const testSongs = [
  {
    id: 'test-song-1',
    title: 'Synthwave Melody',
    artist: 'Test Artist 1',
    album: 'Test Album',
    userId: 'test-user',
    fileUrl: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
    fileName: 'synthwave.mp3',
    fileSize: 1466000,
    uploadedAt: Date.now() - 86400000, // 1 day ago
    genres: [
      { name: 'Electronic', confidence: 0.95 },
      { name: 'Synthwave', confidence: 0.85 },
      { name: 'Ambient', confidence: 0.75 }
    ],
    analyzed: true
  },
  {
    id: 'test-song-2',
    title: 'Acoustic Guitar',
    artist: 'Test Artist 2',
    album: 'Acoustic Sessions',
    userId: 'test-user',
    fileUrl: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
    fileName: 'acoustic.mp3',
    fileSize: 1229000,
    uploadedAt: Date.now() - 43200000, // 12 hours ago
    genres: [
      { name: 'Acoustic', confidence: 0.92 },
      { name: 'Folk', confidence: 0.82 },
      { name: 'Indie', confidence: 0.70 }
    ],
    analyzed: true
  }
];

// Test connection to Supabase storage
export const testStorageConnection = async (): Promise<boolean> => {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.log('[SongStore] Supabase not configured. Using test mode.');
      return true; // Return true to allow the app to continue in test mode
    }
    
    // Test storage connection
    const result = await initializeStorage();
    
    // If initializeStorage returns false, the connection failed
    if (!result) {
      console.error('[SongStore] Failed to initialize Supabase storage');
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('[SongStore] Supabase storage connection test failed:', err);
    return false;
  }
};

interface SongState {
  songs: Song[];
  selectedSong: Song | null;
  currentlyPlaying: Song | null;
  isPlaying: boolean;
  loading: boolean;
  error: string | null;
  
  fetchUserSongs: (userId: string) => Promise<void>;
  uploadSong: (file: File, userId: string, metadata?: { title?: string; artist?: string; album?: string }) => Promise<Song>;
  deleteSong: (songId: string) => Promise<void>;
  analyzeSong: (songId: string) => Promise<Genre[]>;
  selectSong: (song: Song | null) => void;
  setCurrentlyPlaying: (song: Song | null) => void;
  togglePlayState: (isPlaying: boolean) => void;
  clearError: () => void;
  addSong: (song: Song) => void;
  clearTestSongs: () => void;
}

export const useSupabaseSongStore = create<SongState>((set, get) => ({
  songs: [],
  selectedSong: null,
  currentlyPlaying: null,
  isPlaying: false,
  loading: false,
  error: null,
  
  selectSong: (song) => set({ selectedSong: song }),
  setCurrentlyPlaying: (song) => set({ currentlyPlaying: song }),
  togglePlayState: (isPlaying) => set({ isPlaying }),
  clearError: () => set({ error: null }),
  
  addSong: (song) => {
    set(state => {
      // Check if the song already exists
      const exists = state.songs.some(s => s.id === song.id);
      if (exists) {
        // Update the existing song
        return {
          songs: state.songs.map(s => s.id === song.id ? { ...s, ...song } : s)
        };
      } else {
        // Add as a new song
        return {
          songs: [...state.songs, song]
        };
      }
    });
  },
  
  clearTestSongs: () => {
    set(state => ({
      songs: state.songs.filter(song => !song.id.startsWith('test-song-'))
    }));
  },
  
  fetchUserSongs: async (userId) => {
    set({ loading: true, error: null });
    try {
      console.log('[SongStore] Fetching user songs for user:', userId);
      
      // Always use test mode if Supabase client is not available
      const bypassSupabaseForTesting = !supabase;
      
      if (!bypassSupabaseForTesting) {
        // Fetch songs from Supabase database
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('userId', userId)
          .order('uploadedAt', { ascending: false });
        
        if (error) throw error;
        
        console.log('[SongStore] Fetched', data.length, 'songs from Supabase');
        set({ songs: data as Song[], loading: false });
      } else {
        // In bypass mode, provide test songs
        console.log('[SongStore] TESTING MODE: Using sample test songs');
        
        // Keep any songs that were added during this session and add test songs
        set(state => {
          // Filter out songs that match test song IDs to avoid duplicates
          const existingSongs = state.songs.filter(song => 
            !song.id.startsWith('test-song-')
          );
          
          // Add test songs with the correct userId
          const testSongsWithUserId = testSongs.map(song => ({
            ...song,
            userId: userId
          }));
          
          const combinedSongs = [...existingSongs, ...testSongsWithUserId];
          console.log('[SongStore] TESTING MODE: Providing', combinedSongs.length, 'songs');
          return { 
            songs: combinedSongs, 
            loading: false 
          };
        });
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch songs';
      console.error('[SongStore] Error fetching songs:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },
  
  uploadSong: async (file, userId, metadata = {}) => {
    set({ loading: true, error: null });
    try {
      console.log('[SongStore] Starting upload process for:', file.name);

      // Always use test mode if Supabase client is not available
      const bypassSupabaseForTesting = !supabase;
      
      let fileUrl = '';
      // Create a stable ID to prevent duplicates
      const fileId = bypassSupabaseForTesting ? 
        `test-id-${file.name}-${file.size}` : 
        uuidv4();
      
      if (!bypassSupabaseForTesting && supabase) {
        // Make sure storage is initialized
        await initializeStorage();
        
        // Create file path in storage
        const filePath = `${userId}/${fileId}-${file.name}`;
        
        // STEP 1: Upload file to Supabase Storage
        console.log('[SongStore] Uploading to Supabase Storage...');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(SONGS_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        console.log('[SongStore] Upload successful:', uploadData);
        
        // STEP 2: Get public URL for the file
        const { data: publicUrlData } = supabase.storage
          .from(SONGS_BUCKET)
          .getPublicUrl(filePath);
        
        fileUrl = publicUrlData.publicUrl;
        console.log('[SongStore] File URL obtained:', fileUrl);
      } else {
        // Bypass actual upload for testing
        console.log('[SongStore] TESTING MODE: Bypassing actual Supabase upload');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Use a sample audio URL for testing playback
        const sampleMusicUrls = [
          'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
          'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
          'https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum.ogg',
          'https://actions.google.com/sounds/v1/cartoon/pop.ogg',
          'https://actions.google.com/sounds/v1/cartoon/drum_roll.ogg'
        ];
        
        const randomIndex = Math.floor(Math.random() * sampleMusicUrls.length);
        fileUrl = sampleMusicUrls[randomIndex];
        console.log('[SongStore] TESTING MODE: Using sample audio URL for testing:', fileUrl);
      }
      
      // Clear any existing test songs with similar IDs to prevent duplicates
      console.log('[SongStore] Clearing similar test songs before adding new one');
      set(state => {
        const filteredSongs = state.songs.filter(song => 
          song.id !== fileId
        );
        return { songs: filteredSongs };
      });
      
      // Create song document
      const songData: Song = {
        id: fileId,
        title: metadata.title || file.name.split('.')[0],
        artist: metadata.artist || 'Unknown Artist',
        album: metadata.album || 'Unknown Album',
        userId,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: Date.now(),
        genres: [],
        analyzed: false
      };
      
      // STEP 3: Add song metadata to Supabase database
      let newSong = { ...songData };
      
      if (!bypassSupabaseForTesting) {
        console.log('[SongStore] Adding song metadata to Supabase database...');
        const { data: insertData, error: insertError } = await supabase
          .from('songs')
          .insert(songData)
          .select()
          .single();
        
        if (insertError) throw insertError;
        console.log('[SongStore] Song metadata added with ID:', insertData.id);
        newSong = insertData as Song;
      } else {
        // Bypass database for testing
        console.log('[SongStore] TESTING MODE: Bypassing actual Supabase database insertion');
        await new Promise(resolve => setTimeout(resolve, 500));
        newSong = { ...songData };
        console.log('[SongStore] TESTING MODE: Created test song with ID:', newSong.id);
      }
      
      // STEP 4: Genre classification
      try {
        console.log('[SongStore] Starting genre analysis...');
        const genres = await simulateGenreAnalysis(songData.title);
        console.log('[SongStore] Genre analysis complete:', genres);
        
        // Update database with genres
        if (!bypassSupabaseForTesting) {
          const { error: updateError } = await supabase
            .from('songs')
            .update({ genres, analyzed: true })
            .eq('id', newSong.id);
          
          if (updateError) throw updateError;
        }
        
        newSong = { ...newSong, genres, analyzed: true };
      } catch (genreErr) {
        // If genre analysis fails, keep song as not analyzed
        console.error('[SongStore] Genre analysis failed, but upload was successful:', genreErr);
      }
      
      // Update state with the new song
      console.log('[SongStore] Adding new song to local state:', newSong);
      
      // Use the addSong method to prevent duplicates
      const { addSong } = get();
      addSong(newSong);
      
      set({ loading: false });
      
      console.log('[SongStore] Upload complete for:', file.name);
      return newSong;
    } catch (error: any) {
      console.error('[SongStore] Supabase upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload song';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  deleteSong: async (songId) => {
    set({ loading: true, error: null });
    try {
      console.log('[SongStore] Deleting song with ID:', songId);
      
      // Always use test mode if Supabase client is not available
      const bypassSupabaseForTesting = !supabase;
      
      if (!bypassSupabaseForTesting) {
        // First, get the song to find its file path
        const { data: song, error: fetchError } = await supabase
          .from('songs')
          .select('*')
          .eq('id', songId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // Delete the file from storage
        if (song) {
          const userId = song.userId;
          const filePath = `${userId}/${songId}-${song.fileName}`;
          
          const { error: storageError } = await supabase.storage
            .from(SONGS_BUCKET)
            .remove([filePath]);
          
          if (storageError) {
            console.error('[SongStore] Error deleting file from storage:', storageError);
            // Continue anyway to delete the database record
          }
        }
        
        // Delete the song record from the database
        const { error: deleteError } = await supabase
          .from('songs')
          .delete()
          .eq('id', songId);
        
        if (deleteError) throw deleteError;
        
        console.log('[SongStore] Successfully deleted song from Supabase');
      } else {
        // In testing mode, just skip the actual deletion
        console.log('[SongStore] TESTING MODE: Bypassing Supabase deletion');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Update local state to remove the song
      set(state => ({
        songs: state.songs.filter(song => song.id !== songId),
        loading: false
      }));
      
      // If the deleted song was selected or playing, clear those states
      set(state => {
        const updates: Partial<SongState> = {};
        
        if (state.selectedSong?.id === songId) {
          updates.selectedSong = null;
        }
        
        if (state.currentlyPlaying?.id === songId) {
          updates.currentlyPlaying = null;
          updates.isPlaying = false;
        }
        
        return updates;
      });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete song';
      console.error('[SongStore] Error deleting song:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },
  
  analyzeSong: async (songId) => {
    set({ loading: true, error: null });
    try {
      console.log('[SongStore] Analyzing song:', songId);
      
      // Always use test mode if Supabase client is not available
      const bypassSupabaseForTesting = !supabase;
      
      // Get the song from state
      const song = get().songs.find(s => s.id === songId);
      if (!song) {
        throw new Error('Song not found');
      }
      
      // Simulate genre analysis
      const genres = await simulateGenreAnalysis(song.title);
      
      if (!bypassSupabaseForTesting) {
        // Update in Supabase
        const { error } = await supabase
          .from('songs')
          .update({ genres, analyzed: true })
          .eq('id', songId);
        
        if (error) throw error;
      } else {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Update in local state
      set(state => ({
        songs: state.songs.map(s => 
          s.id === songId ? { ...s, genres, analyzed: true } : s
        ),
        loading: false
      }));
      
      return genres;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze song';
      console.error('[SongStore] Error analyzing song:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  }
})); 