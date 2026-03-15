import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  photo_url: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<{ confirmEmail: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchProfile = useCallback(async (currentUser: User): Promise<Profile | null> => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return null;
    fetchingRef.current = true;

    try {
      // Try to read existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data && !error) {
        return data as Profile;
      }

      // Profile not found — the DB trigger may not have run yet.
      // Wait briefly then retry once (trigger is async)
      if (error?.code === 'PGRST116') {
        await new Promise(r => setTimeout(r, 1000));
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (retryData && !retryError) {
          return retryData as Profile;
        }

        // Still no profile — create one via service role wouldn't work client-side
        // because there's no INSERT RLS policy for profiles.
        // Return a local fallback profile so the app doesn't hang.
        console.warn('Profile not found in DB after retry. Using local fallback.');
        return {
          id: currentUser.id,
          email: currentUser.email || '',
          display_name: currentUser.user_metadata?.display_name || 'Utilisateur',
          photo_url: currentUser.user_metadata?.avatar_url || '',
          role: 'user',
          created_at: new Date().toISOString(),
        };
      }

      console.error('Supabase profile fetch error:', error);
      return null;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const handleSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setUser(session.user);

    const p = await fetchProfile(session.user);
    if (p) {
      setProfile(p);
      setIsAdmin(p.role === 'admin');
    } else {
      setProfile(null);
      setIsAdmin(false);
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Use ONLY onAuthStateChange — it fires INITIAL_SESSION on mount
    // Do NOT also call getSession() as that causes a double-fetch race condition
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setLoading(false);
      throw mapAuthError(error);
    }
    // onAuthStateChange will fire and call handleSession
  };

  const registerWithEmail = async (email: string, pass: string, name: string): Promise<{ confirmEmail: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { display_name: name } }
    });
    if (error) throw mapAuthError(error);

    // If Supabase requires email confirmation, session will be null
    const needsConfirmation = !data.session;
    return { confirmEmail: needsConfirmation };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw mapAuthError(error);
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      throw mapAuthError(error);
    }
    // onAuthStateChange will fire and call handleSession
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, loginWithEmail, registerWithEmail, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

function mapAuthError(error: { message: string; status?: number }): Error {
  const msg = error.message;
  if (msg.includes('Invalid login credentials')) return new Error('Email ou mot de passe incorrect.');
  if (msg.includes('Email not confirmed')) return new Error('Veuillez confirmer votre email avant de vous connecter.');
  if (msg.includes('User already registered')) return new Error('Un compte existe déjà avec cet email.');
  if (msg.includes('Password should be at least')) return new Error('Le mot de passe doit contenir au moins 6 caractères.');
  if (msg.includes('rate limit')) return new Error('Trop de tentatives. Veuillez patienter quelques minutes.');
  if (msg.includes('Unable to validate email')) return new Error('Adresse email invalide.');
  if (msg.includes('Signup requires a valid password')) return new Error('Veuillez entrer un mot de passe valide.');
  return new Error(msg);
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
