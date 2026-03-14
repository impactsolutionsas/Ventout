import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
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
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const newProfile = {
              id: userId,
              email: userData.user.email,
              role: 'user',
              display_name: userData.user.user_metadata.display_name || 'Utilisateur',
              photo_url: userData.user.user_metadata.avatar_url || '',
              created_at: new Date().toISOString()
            };
            const { data: insertedProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();
            
            if (!insertError && insertedProfile) {
              setProfile(insertedProfile as Profile);
              setIsAdmin(insertedProfile.role === 'admin');
            }
          }
        } else {
          console.error("Supabase error in AuthContext:", error);
          setIsAdmin(false);
        }
      } else {
        setProfile(data as Profile);
        setIsAdmin(data?.role === 'admin');
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    // Google Auth removed as requested
    alert("La connexion Google a été désactivée. Veuillez utiliser votre email.");
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            display_name: name
          }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        const newProfile = {
          id: data.user.id,
          email: email,
          role: 'user',
          display_name: name,
          created_at: new Date().toISOString()
        };
        await supabase.from('profiles').insert([newProfile]);
      }
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  };

  const handleAuthError = (error: any) => {
    console.error("Auth error:", error);
    if (error.message?.includes("provider is not enabled")) {
      alert("L'authentification Google n'est pas activée dans votre tableau de bord Supabase. Veuillez l'activer dans Authentification > Providers > Google, ou utilisez la connexion par email.");
    } else {
      alert(`Erreur d'authentification : ${error.message}`);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      isAdmin, 
      loading, 
      login, 
      loginWithEmail, 
      registerWithEmail, 
      resetPassword, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
