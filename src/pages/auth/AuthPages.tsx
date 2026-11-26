import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePageTitle } from '@/hooks/useStoreQueries';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from '@/schemas/forms';

export function LoginPage() {
  usePageTitle('Masuk Akun');
  const { signIn, signInPreviewRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/akun';
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      await signIn(values.email, values.password);
      showToast('Selamat datang kembali di Abadikala!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal masuk.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-12">
      <div className="card-editorial w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo />
          <h1 className="mt-5 font-serif text-3xl font-semibold text-ink-primary">
            Masuk ke Akun Anda
          </h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Pantau pesanan, simpan alamat, dan kelola wishlist dengan mudah.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">Email</label>
            <input type="email" {...register('email')} className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-secondary">Kata Sandi</label>
              <Link to="/lupa-password" className="text-xs text-brand-primary hover:underline">
                Lupa kata sandi?
              </Link>
            </div>
            <input type="password" {...register('password')} className="input-field" />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {!isSupabaseConfigured && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs">
            <p className="font-semibold text-amber-900">Akses Cepat Mode Pratinjau Lokal</p>
            <p className="mt-1 text-amber-800">
              Supabase belum terhubung. Anda dapat langsung mencoba pengalaman akun pelanggan:
            </p>
            <button
              type="button"
              onClick={() => {
                signInPreviewRole('customer');
                navigate(redirectTo, { replace: true });
              }}
              className="btn-secondary mt-3 w-full py-2 text-xs"
            >
              Masuk sebagai Pelanggan Pratinjau
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-secondary">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-brand-primary hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  usePageTitle('Daftar Akun');
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true);
    try {
      await signUp({
        full_name: values.full_name,
        email: values.email,
        whatsapp_number: values.whatsapp_number,
        password: values.password,
      });
      showToast('Akun berhasil dibuat! Selamat datang di Abadikala.');
      navigate('/akun', { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mendaftar.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-editorial flex min-h-[75vh] items-center justify-center py-12">
      <div className="card-editorial w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo />
          <h1 className="mt-5 font-serif text-3xl font-semibold text-ink-primary">
            Buat Akun Pelanggan
          </h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Bergabung bersama Abadikala Fresh Flowers untuk kemudahan pemesanan.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">
              Nama Lengkap
            </label>
            <input {...register('full_name')} className="input-field" />
            {errors.full_name && (
              <p className="mt-1 text-xs text-rose-600">{errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">Email</label>
            <input type="email" {...register('email')} className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">
              Nomor WhatsApp
            </label>
            <input {...register('whatsapp_number')} placeholder="08xxxxxxxxxx" className="input-field" />
            {errors.whatsapp_number && (
              <p className="mt-1 text-xs text-rose-600">{errors.whatsapp_number.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">
              Kata Sandi
            </label>
            <input type="password" {...register('password')} className="input-field" />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">
              Konfirmasi Kata Sandi
            </label>
            <input type="password" {...register('confirm_password')} className="input-field" />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-rose-600">{errors.confirm_password.message}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-secondary">
          Sudah memiliki akun?{' '}
          <Link to="/login" className="font-semibold text-brand-primary hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  usePageTitle('Lupa Kata Sandi');
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw new Error(error.message);
      }
      setSent(true);
      showToast('Permintaan reset kata sandi telah diproses.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim reset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-editorial flex min-h-[65vh] items-center justify-center py-12">
      <div className="card-editorial w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-ink-primary">
          Reset Kata Sandi
        </h1>
        {sent ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-ink-secondary">
              {isSupabaseConfigured
                ? `Tautan pemulihan kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk Anda.`
                : 'Pada mode pratinjau lokal, pengiriman email tidak aktif. Hubungkan Supabase Auth untuk mengaktifkan reset password via email.'}
            </p>
            <Link to="/login" className="btn-primary w-full">
              Kembali ke Halaman Masuk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-5 space-y-4 text-left">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-secondary">
                Alamat Email Terdaftar
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AdminLoginPage() {
  usePageTitle('Login Dashboard Admin');
  const { signIn, signInPreviewRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      await signIn(values.email, values.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal masuk ke dashboard admin.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-forest px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-card p-8 shadow-elevated">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-blush px-3 py-1 text-xs font-semibold text-brand-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Portal Administrasi Terproteksi
          </span>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-ink-primary">
            Masuk Dashboard Admin
          </h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Hanya akun dengan peran Super Admin, Admin, atau Staff yang diizinkan mengakses panel
            ini.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">Email Admin</label>
            <input type="email" {...register('email')} className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">Kata Sandi</label>
            <input type="password" {...register('password')} className="input-field" />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? 'Memverifikasi...' : 'Masuk ke Admin'}
          </button>
        </form>

        {!isSupabaseConfigured && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs">
            <p className="font-semibold text-amber-900">Mode Pratinjau Lokal (Pilih Role RBAC)</p>
            <p className="mt-1 text-amber-800">
              Tombol ini hanya aktif saat Supabase belum dikonfigurasi untuk menguji hak akses
              dashboard secara lokal.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  signInPreviewRole('super_admin');
                  navigate('/admin', { replace: true });
                }}
                className="rounded-xl bg-brand-primary px-2 py-2 font-semibold text-white hover:bg-brand-primary-hover"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  signInPreviewRole('admin');
                  navigate('/admin', { replace: true });
                }}
                className="rounded-xl border border-brand-primary/30 bg-white px-2 py-2 font-semibold text-brand-primary hover:bg-brand-blush"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  signInPreviewRole('staff');
                  navigate('/admin', { replace: true });
                }}
                className="rounded-xl border border-line-subtle bg-white px-2 py-2 font-semibold text-ink-primary hover:bg-surface-muted"
              >
                Staff
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-ink-secondary hover:text-brand-primary">
            ← Kembali ke Toko Abadikala
          </Link>
        </div>
      </div>
    </div>
  );
}
