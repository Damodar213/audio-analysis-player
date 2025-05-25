import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  signup: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  
  signup: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      
      const user = userCredential.user;
      set({ 
        user: {
          uid: user.uid,
          email: user.email || email,
          displayName: displayName,
          photoURL: user.photoURL
        },
        loading: false
      });
      
      return userCredential;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      set({ 
        user: {
          uid: user.uid,
          email: user.email || email,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        loading: false
      });
      
      return userCredential;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  setUser: (user) => set({ user }),
  
  clearError: () => set({ error: null })
}));