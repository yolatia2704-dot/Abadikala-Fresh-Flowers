import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { readLocalDb, writeLocalDb } from '@/services/localStore';
import type { AppRole, UserProfile } from '@/types/database';

const LOCAL_SESSION_KEY = 'abadikala_preview_session_v1';

export function translateAuthError(message: string): string {
  const lower = (message || '').toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Email atau kata sandi salah. Silakan periksa kembali.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email Anda belum terkonfirmasi. Silakan hubungi admin atau coba masuk kembali.';
  }
  if (lower.includes('user already registered') || lower.includes('sudah terdaftar') || lower.includes('duplicate key')) {
    return 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu sebentar lalu coba lagi.';
  }
  if (lower.includes('password should be at least') || lower.includes('minimal 6 karakter')) {
    return 'Kata sandi minimal 6 karakter.';
  }
  if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return 'Format alamat email tidak valid.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Koneksi ke server terganggu. Pastikan internet Anda stabil lalu coba lagi.';
  }
  return message || 'Terjadi kendala autentikasi. Silakan coba lagi.';
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (payload: {
    full_name: string;
    email: string;
    whatsapp_number: string;
    password: string;
  }) => Promise<UserProfile | null>;
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
    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
    ]);

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

  const signIn = async (email: string, password: string): Promise<UserProfile | null> => {
    const cleanEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw new Error(translateAuthError(error.message));
      if (data.user) {
        const prof = await loadSupabaseProfile(data.user.id, data.user.email || cleanEmail);
        setUser(prof);
        return prof;
      }
      return null;
    }

    const db = readLocalDb();
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
    return safeUser;
  };

  const signUp = async (payload: {
    full_name: string;
    email: string;
    whatsapp_number: string;
    password: string;
  }): Promise<UserProfile | null> => {
    const cleanEmail = payload.email.trim().toLowerCase();
    if (isSupabaseConfigured && supabase) {
      // Uses server-side instant confirmed registration RPC to avoid Supabase free-tier SMTP rate limits,
      // then immediately creates a real authenticated JWT session via signInWithPassword.
      const { error: rpcErr } = await supabase.rpc('register_customer_instant', {
        p_email: cleanEmail,
        p_password: payload.password,
        p_full_name: payload.full_name.trim(),
        p_whatsapp_number: payload.whatsapp_number.trim(),
      });
      if (rpcErr) {
        throw new Error(translateAuthError(rpcErr.message));
      }

      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: payload.password,
      });
      if (loginErr) {
        throw new Error(translateAuthError(loginErr.message));
      }
      if (loginData.user) {
        const prof = await loadSupabaseProfile(loginData.user.id, cleanEmail);
        setUser(prof);
        return prof;
      }
      return null;
    }

    const db = readLocalDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.');
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
    return safeUser;
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
