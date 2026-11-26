import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, MailOpen, Search, Shield } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePageTitle } from '@/hooks/useStoreQueries';
import {
  fetchAdminCustomers,
  fetchAuditLogs,
  fetchContactMessages,
  updateContactMessageStatus,
} from '@/services/api';
import { formatDateTime, formatRupiah } from '@/utils/format';

export function AdminCustomersPage() {
  usePageTitle('Pelanggan & Audit Log — Admin');
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'customers' | 'messages' | 'audit'>('customers');
  const [search, setSearch] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: fetchAdminCustomers,
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: fetchContactMessages,
  });
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: fetchAuditLogs,
  });

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.whatsapp_number || '').includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-ink-primary">
          Pelanggan, Pesan Masuk & Audit Log
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Data pelanggan dilindungi berdasarkan hak akses peran admin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('customers')}
          className={tab === 'customers' ? 'btn-primary py-2 text-xs' : 'btn-secondary py-2 text-xs'}
        >
          Daftar Pelanggan ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('messages')}
          className={tab === 'messages' ? 'btn-primary py-2 text-xs' : 'btn-secondary py-2 text-xs'}
        >
          Pesan Kontak ({messages.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('audit')}
          className={tab === 'audit' ? 'btn-primary py-2 text-xs' : 'btn-secondary py-2 text-xs'}
        >
          <Shield className="h-3.5 w-3.5" /> Audit Log ({auditLogs.length})
        </button>
      </div>

      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="card-editorial p-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, atau nomor WhatsApp..."
                className="input-field pl-9 text-xs"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <EmptyState
              title="Belum ada data pelanggan"
              description="Pelanggan yang mendaftar atau menyelesaikan pesanan akan tercatat di sini."
            />
          ) : (
            <div className="card-editorial overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line-subtle bg-surface-muted/60 text-ink-secondary">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Kontak</th>
                      <th className="px-4 py-3">Jumlah Pesanan</th>
                      <th className="px-4 py-3">Total Belanja Terkonfirmasi</th>
                      <th className="px-4 py-3">Bergabung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 font-semibold text-ink-primary">{c.full_name}</td>
                        <td className="px-4 py-3">
                          <p>{c.email}</p>
                          <p className="text-ink-muted">{c.whatsapp_number || '-'}</p>
                        </td>
                        <td className="px-4 py-3">{c.order_count}</td>
                        <td className="px-4 py-3 font-semibold text-brand-primary">
                          {formatRupiah(c.total_spent)}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{formatDateTime(c.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-3">
          {messages.length === 0 ? (
            <EmptyState
              title="Belum ada pesan kontak"
              description="Pesan yang dikirim melalui halaman Kontak akan muncul di sini."
            />
          ) : (
            messages.map((m) => (
              <div key={m.id} className="card-editorial p-5 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-serif text-xl font-semibold text-ink-primary">
                        {m.subject}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          m.status === 'unread'
                            ? 'bg-brand-blush text-brand-primary'
                            : m.status === 'replied'
                              ? 'bg-brand-sage-soft text-brand-sage'
                              : 'bg-surface-muted text-ink-secondary'
                        }`}
                      >
                        {m.status === 'unread'
                          ? 'Baru'
                          : m.status === 'replied'
                            ? 'Dibalas'
                            : 'Dibaca'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-ink-secondary">
                      Dari <strong>{m.name}</strong> ({m.email}){' '}
                      {m.whatsapp ? `• WA: ${m.whatsapp}` : ''}
                    </p>
                  </div>
                  <span className="text-ink-muted">{formatDateTime(m.created_at)}</span>
                </div>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-primary">
                  {m.message}
                </p>
                {user && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line-subtle pt-3">
                    {m.status === 'unread' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await updateContactMessageStatus(m.id, 'read', {
                            email: user.email,
                            role: user.role,
                          });
                          await qc.invalidateQueries({ queryKey: ['admin-messages'] });
                          showToast('Pesan ditandai sudah dibaca.', 'info');
                        }}
                        className="btn-secondary py-1.5 text-xs"
                      >
                        <MailOpen className="h-3.5 w-3.5" /> Tandai Dibaca
                      </button>
                    )}
                    {m.status !== 'replied' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await updateContactMessageStatus(m.id, 'replied', {
                            email: user.email,
                            role: user.role,
                          });
                          await qc.invalidateQueries({ queryKey: ['admin-messages'] });
                          showToast('Pesan ditandai sudah dibalas.');
                        }}
                        className="btn-primary py-1.5 text-xs"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Tandai Sudah Dibalas
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="card-editorial overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-secondary">
              Belum ada aktivitas admin yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line-subtle bg-surface-muted/60 text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Aktor</th>
                    <th className="px-4 py-3">Aksi</th>
                    <th className="px-4 py-3">Ringkasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 text-ink-muted">{formatDateTime(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{log.actor_email}</span>{' '}
                        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px]">
                          {log.actor_role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-brand-primary">{log.action}</td>
                      <td className="px-4 py-3 text-ink-secondary">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
