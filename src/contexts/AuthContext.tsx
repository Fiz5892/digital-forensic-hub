import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';
import { logAuthEvent } from '@/lib/auditLogger';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

interface SignupOptions {
  department?: string | null;
  phone?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (
    email: string, 
    password: string, 
    fullName: string,
    options?: SignupOptions
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const appUser: AppUser = {
        id: userId,
        name: profile?.full_name || email.split('@')[0],
        email: profile?.email || email,
        role: (roleData?.role as UserRole) || 'reporter',
        department: profile?.department || undefined,
        phone: profile?.phone || undefined,
      };

      setUser(appUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set basic user info if profile fetch fails
      setUser({
        id: userId,
        name: email.split('@')[0],
        email: email,
        role: 'reporter',
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id, session.user.email || '');
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || '');
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Email atau password salah' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Email belum dikonfirmasi. Periksa inbox Anda.' };
        }
        return { error: error.message };
      }

      // LOG AUDIT: Login berhasil
      if (data.user) {
        await logAuthEvent('login', email, data.user.id);
      }

      return { error: null };
    } catch (err) {
      return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    fullName: string,
    options?: SignupOptions
  ): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Create auth user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            department: options?.department || null,
            phone: options?.phone || null,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { error: 'Email sudah terdaftar. Silakan login.' };
        }
        if (error.message.includes('Password should be at least')) {
          return { error: 'Password minimal 6 karakter' };
        }
        return { error: error.message };
      }

      // If signup successful and user created, update profile with additional data
      if (data.user && (options?.department || options?.phone)) {
        // Wait a bit for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update profile with department and phone
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            department: options.department || null,
            phone: options.phone || null,
          })
          .eq('user_id', data.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          // Don't return error here, signup was successful
        }
      }

      return { error: null };
    } catch (err) {
      return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
    }
  };

  const logout = async () => {
    try {
      // Dapatkan email user sebelum logout untuk audit log
      const userEmail = user?.email || 'unknown';
      const userId = user?.id;

      // LOG AUDIT: Logout
      if (userId) {
        await logAuthEvent('logout', userEmail, userId);
      }

      // Lakukan logout
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      login, 
      signup,
      logout, 
      isAuthenticated: !!session,
      isLoading,
      hasRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}