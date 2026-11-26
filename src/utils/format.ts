export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'Harga Menyesuaikan';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export function buildWhatsAppUrl(phone: string, message?: string): string | null {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${normalized}${query}`;
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escapeCell = (cell: string | number | null | undefined) => {
    const str = cell === null || cell === undefined ? '' : String(cell);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csvContent = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
