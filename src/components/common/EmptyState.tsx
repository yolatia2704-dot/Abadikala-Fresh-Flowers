import React from 'react';
import { Flower2, Database } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-subtle bg-surface-card/70 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
        {icon || <Flower2 className="h-6 w-6" />}
      </div>
      <h3 className="font-serif text-2xl font-medium text-ink-primary">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-secondary">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-card">
          <div className="aspect-[3/4] animate-pulse bg-surface-muted" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-surface-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModeBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="no-print border-b border-amber-200/80 bg-amber-50/90 px-4 py-1.5 text-center text-xs text-amber-900">
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Database className="h-3.5 w-3.5 shrink-0" />
        Mode Pratinjau Lokal (Supabase belum dikonfigurasi):
      </span>{' '}
      Data pesanan & pengaturan disimpan sementara di browser Anda, bukan di server produksi.
    </div>
  );
}
