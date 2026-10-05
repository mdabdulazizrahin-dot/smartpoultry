import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { saveDriveToken, clearDriveToken } from '@/lib/googleDriveBackup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (mobile: string, password: string, recoveryPin?: string) => Promise<{ error: Error | null }>;
  signIn: (mobile: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser((prev) => {
          const next = session?.user ?? null;
          if (!prev && !next) return null;
          if (prev && next && prev.id === next.id && prev.email === next.email) {
            return prev;
          }
          return next;
        });
        setLoading(false);

        // Ensure profile exists for signed in user (including Google OAuth)
        if (session?.user) {
          const u = session.user;
          const mobileNumber = u.phone || u.user_metadata?.phone || u.email?.replace('@poultry.app', '') || u.email || 'unknown';
          const avatar = u.user_metadata?.avatar_url || null;

          supabase
            .from('profiles')
            .select('id')
            .eq('user_id', u.id)
            .maybeSingle()
            .then(({ data: profileData, error: profileErr }) => {
              if (!profileData && !profileErr) {
                supabase
                  .from('profiles')
                  .upsert(
                    {
                      user_id: u.id,
                      mobile_number: mobileNumber,
                      avatar_url: avatar,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                  )
                  .then(({ error: insertError }) => {
                    if (insertError) console.error('Auto create profile error:', insertError);
                  });
              }
            });
        }

        // Capture Google OAuth provider token right after sign-in so we can
        // back up data into the user's own Google Drive (appDataFolder) if available.
        if (session?.provider_token) {
          const expiresIn =
            (session as unknown as { provider_token_expires_in?: number })
              .provider_token_expires_in ?? 3500;
          saveDriveToken(session.provider_token, expiresIn);
          window.dispatchEvent(new Event('drive_connection_changed'));
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser((prev) => {
        const next = session?.user ?? null;
        if (!prev && !next) return null;
        if (prev && next && prev.id === next.id && prev.email === next.email) {
          return prev;
        }
        return next;
      });
      setLoading(false);
      if (session?.provider_token) {
        saveDriveToken(session.provider_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const normalizeMobile = (m: string) => {
    return m
      .replace(/[০-৯]/g, (d) => '0123456789'['০১২৩৪৫৬৭৮৯'.indexOf(d)])
      .replace(/[^0-9]/g, '')
      .trim();
  };

  const signUp = async (mobile: string, password: string, recoveryPin?: string) => {
    try {
      const cleanMobile = normalizeMobile(mobile);
      // Use mobile as email format for auth
      const email = `${cleanMobile}@poultry.app`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            mobile_number: cleanMobile,
            recovery_pin: recoveryPin || null,
          }
        }
      });

      if (error) throw error;

      // Create profile with mobile number and recovery PIN
      if (data.user) {
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          mobile_number: cleanMobile,
          ...(recoveryPin ? { recovery_pin: recoveryPin } : {}),
        } as any, { onConflict: 'user_id' });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (mobile: string, password: string) => {
    try {
      const cleanMobile = normalizeMobile(mobile);
      const email = `${cleanMobile}@poultry.app`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Keep local safety backups so farmer data is never permanently wiped
    const current = localStorage.getItem('poultryFarmData');
    if (current) {
      localStorage.setItem('poultryFarmData_last_backup', current);
    }
    const currentSys = localStorage.getItem('smartPoultrySystem');
    if (currentSys) {
      localStorage.setItem('smartPoultrySystem_last_backup', currentSys);
    }
    clearDriveToken();
    // Clear notification keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('notified_')) {
        localStorage.removeItem(key);
      }
    });
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
