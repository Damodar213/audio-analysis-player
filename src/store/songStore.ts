import { create } from 'zustand';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { storage, db } from '../firebase/config';
import { Song, Genre } from '../types';
import { simulateGenreAnalysis } from '../utils/genreAnalysis';

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
}

export const useSongStore = create<SongState>((set, get) => ({
  songs: [],
  selectedSong: null,
  currentlyPlaying: null,
  isPlaying: false,
  loading: false,
  error: null,
  
  fetchUserSongs: async (userId) => {
    set({ loading: true, error: null });
    try {
      const songsQuery = query(
        collection(db, 'songs'),
        where('userId', '==', userId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(songsQuery);
      const songsData: Song[] = [];
      
      querySnapshot.forEach((doc) => {
        const songData = doc.data() as Song;
        songsData.push({ ...songData, id: doc.id });
      });
      
      set({ songs: songsData, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch songs';
      set({ error: errorMessage, loading: false });
    }
  },
  
  uploadSong: async (file, userId, metadata = {}) => {
    set({ loading: true, error: null });
    try {
      // Create a storage reference
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `songs/${userId}/${fileId}.${fileExtension}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const fileUrl = await getDownloadURL(storageRef);
      
      // Create initial song document (without genres)
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
      
      // Add song to Firestore (get docRef for update)
      const docRef = await addDoc(collection(db, 'songs'), songData);
      let newSong = { ...songData, id: docRef.id };
      
      // --- Genre classification step ---
      try {
        const genres = await simulateGenreAnalysis(songData.title);
        // Update Firestore with genres
        await updateDoc(docRef, {
          genres,
          analyzed: true
        });
        newSong = { ...newSong, genres, analyzed: true };
      } catch (genreErr) {
        // If genre analysis fails, keep song as not analyzed
        console.error('Genre analysis failed:', genreErr);
      }
      // --- End genre classification ---
      
      set((state) => ({ 
        songs: [newSong, ...state.songs],
        loading: false
      }));
      
      return newSong;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload song';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  deleteSong: async (songId) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'songs', songId));
      
      set((state) => ({
        songs: state.songs.filter((song) => song.id !== songId),
        selectedSong: state.selectedSong?.id === songId ? null : state.selectedSong,
        currentlyPlaying: state.currentlyPlaying?.id === songId ? null : state.currentlyPlaying,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete song';
      set({ error: errorMessage, loading: false });
    }
  },
  
  analyzeSong: async (songId) => {
    set({ loading: true, error: null });
    try {
      const { songs } = get();
      const song = songs.find(s => s.id === songId);
      
      if (!song) {
        throw new Error('Song not found');
      }
      
      // For the MVP, we'll use a mock analysis response
      // In a real app, this would send the audio file to a backend for ML processing
      const genres = await simulateGenreAnalysis(song.title);
      
      // Update the song in Firestore
      const songRef = doc(db, 'songs', songId);
      await updateDoc(songRef, {
        genres,
        analyzed: true
      });
      
      // Update local state
      set((state) => ({
        songs: state.songs.map(s => 
          s.id === songId 
            ? { ...s, genres, analyzed: true } 
            : s
        ),
        selectedSong: state.selectedSong?.id === songId 
          ? { ...state.selectedSong, genres, analyzed: true }
          : state.selectedSong,
        loading: false
      }));
      
      return genres;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze song';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  selectSong: (song) => set({ selectedSong: song }),
  
  setCurrentlyPlaying: (song) => set({ currentlyPlaying: song }),
  
  togglePlayState: (isPlaying) => set({ isPlaying }),
  
  clearError: () => set({ error: null })
}));