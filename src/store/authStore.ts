import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import { AuthError, UserResponse, AuthTokenResponsePassword } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  signup: (email: string, password: string, displayName: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  
  signup: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });

      if (error) throw error;
      if (data.user && !data.session) {
        set({ 
          loading: false, 
          error: "Signup successful! Please check your email to confirm your account before logging in.",
          user: null
        });
        return { ...data, message: "Confirmation email sent." }; 
      }
      
      if (!data.user || !data.session) {
        throw new Error('Signup failed or email confirmation pending, user session not established.');
      }

      set({ 
        user: {
          uid: data.user.id,
          email: data.user.email || email,
          displayName: data.user.user_metadata?.full_name || displayName,
          photoURL: data.user.user_metadata?.avatar_url || null,
        },
        loading: false,
        error: null
      });
      return data;
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : (error as Error).message || 'An unknown error occurred';
      set({ error: errorMessage, loading: false, user: null });
      throw error;
    }
  },
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed, no user data returned');

      set({ 
        user: {
          uid: data.user.id,
          email: data.user.email || email,
          displayName: data.user.user_metadata?.full_name || data.user.email,
          photoURL: data.user.user_metadata?.avatar_url || null,
        },
        loading: false
      });
      return data;
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : (error as Error).message || 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  logout: async () => {
    set({ loading: true });
    try {
      console.log('[AuthStore] Attempting to log out. Current user state:', get().user);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('[AuthStore] Logout successful.');
      set({ user: null, loading: false });
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : (error as Error).message || 'An unknown error occurred';
      console.error('[AuthStore] Logout failed:', errorMessage);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  resetPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
      });
      if (error) throw error;
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : (error as Error).message || 'An unknown error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  setUser: (user) => set({ user }),
  
  clearError: () => set({ error: null })
}));