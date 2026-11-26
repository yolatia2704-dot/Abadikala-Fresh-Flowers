import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { readLocalDb, writeLocalDb } from '@/services/localStore';
import type { AppRole, UserProfile } from '@/types/database';

const LOCAL_SESSION_KEY = 'abadikala_preview_session_v1';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    full_name: string;
    email: string;
    whatsapp_number: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { full_name: string; whatsapp_number: string }) => Promise<void>;
  /** Strictly available ONLY in Local Preview Mode when Supabase is not configured */
  signInPreviewRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSupabaseProfile = async (userId: string, email: string) => {
    if (!supabase) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return {
      id: userId,
      full_name: profile?.full_name || email.split('@')[0],
      email: profile?.email || email,
      whatsapp_number: profile?.whatsapp_number || null,
      avatar_url: profile?.avatar_url || null,
      role: (roleRow?.role as AppRole) || 'customer',
      is_active: profile?.is_active ?? true,
      created_at: profile?.created_at || new Date().toISOString(),
    } satisfies UserProfile;
  };

  useEffect(() => {
    let active = true;
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (!active) return;
        if (data.session?.user) {
          const prof = await loadSupabaseProfile(
            data.session.user.id,
            data.session.user.email || ''
          );
          if (active) setUser(prof);
        }
        if (active) setIsLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!active) return;
        if (session?.user) {
          const prof = await loadSupabaseProfile(session.user.id, session.user.email || '');
          if (active) setUser(prof);
        } else {
          if (active) setUser(null);
        }
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_SESSION_KEY);
        if (raw) setUser(JSON.parse(raw) as UserProfile);
      } catch {
        // ignore parse errors
      }
      setIsLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (data.user) {
        const prof = await loadSupabaseProfile(data.user.id, data.user.email || email);
        setUser(prof);
      }
      return;
    }

    const db = readLocalDb();
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!existing) {
      throw new Error(
        'Akun belum terdaftar di pratinjau lokal. Silakan daftar terlebih dahulu atau gunakan akses pratinjau.'
      );
    }
    if (existing.password_hash && existing.password_hash !== password) {
      throw new Error('Kata sandi tidak cocok.');
    }
    const { password_hash: _pw, ...safeUser } = existing;
    void _pw;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const signUp = async (payload: {
    full_name: string;
    email: string;
    whatsapp_number: string;
    password: string;
  }) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.full_name,
            whatsapp_number: payload.whatsapp_number,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (data.user) {
        const prof = await loadSupabaseProfile(data.user.id, payload.email);
        setUser(prof);
      }
      return;
    }

    const db = readLocalDb();
    const cleanEmail = payload.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
    }
    const newUser: UserProfile & { password_hash?: string } = {
      id: crypto.randomUUID(),
      full_name: payload.full_name.trim(),
      email: cleanEmail,
      whatsapp_number: payload.whatsapp_number.trim(),
      avatar_url: null,
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
      password_hash: payload.password,
    };
    db.users.push(newUser);
    writeLocalDb(db);
    const { password_hash: _pw, ...safeUser } = newUser;
    void _pw;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
    setUser(null);
  };

  const updateProfile = async (patch: { full_name: string; whatsapp_number: string }) => {
    if (!user) return;
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: patch.full_name,
          whatsapp_number: patch.whatsapp_number,
        })
        .eq('id', user.id);
      if (error) throw new Error(error.message);
    } else {
      const db = readLocalDb();
      const idx = db.users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        db.users[idx].full_name = patch.full_name;
        db.users[idx].whatsapp_number = patch.whatsapp_number;
        writeLocalDb(db);
      }
    }
    const next = { ...user, ...patch };
    if (!isSupabaseConfigured) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(next));
    }
    setUser(next);
  };

  const signInPreviewRole = (role: AppRole) => {
    if (isSupabaseConfigured) return;
    const labels: Record<AppRole, { name: string; email: string }> = {
      super_admin: { name: 'Pemilik Abadikala (Preview)', email: 'owner-preview@abadikala.local' },
      admin: { name: 'Admin Studio (Preview)', email: 'admin-preview@abadikala.local' },
      staff: { name: 'Staff Florist (Preview)', email: 'staff-preview@abadikala.local' },
      customer: { name: 'Pelanggan Pratinjau', email: 'customer-preview@abadikala.local' },
    };
    const previewUser: UserProfile = {
      id: `preview-${role}`,
      full_name: labels[role].name,
      email: labels[role].email,
      whatsapp_number: null,
      avatar_url: null,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(previewUser));
    setUser(previewUser);
  };

  const isAdmin = Boolean(user && ['super_admin', 'admin', 'staff'].includes(user.role));
  const isManager = Boolean(user && ['super_admin', 'admin'].includes(user.role));

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isManager,
        signIn,
        signUp,
        signOut,
        updateProfile,
        signInPreviewRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
