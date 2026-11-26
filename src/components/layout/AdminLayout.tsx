import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  FileEdit,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ModeBanner } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/admin/custom-order', label: 'Custom Order', icon: Sparkles },
  { to: '/admin/produk', label: 'Produk & HPP', icon: Package },
  { to: '/admin/kategori', label: 'Kategori', icon: FolderTree },
  { to: '/admin/stok', label: 'Manajemen Stok', icon: Boxes },
  { to: '/admin/pelanggan', label: 'Pelanggan & Log', icon: Users },
  { to: '/admin/konten', label: 'CMS Website', icon: FileEdit },
  { to: '/admin/pengaturan', label: 'Pengaturan & Legal', icon: Settings },
  { to: '/admin/laporan', label: 'Laporan & Laba', icon: BarChart3 },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-brand-forest text-[#F6F1E7]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <BrandLogo dark />
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1 text-white/70 hover:text-white lg:hidden"
          aria-label="Tutup sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/5 px-3 py-2.5 text-xs">
          <p className="truncate font-semibold text-white">{user?.full_name || 'Admin'}</p>
          <p className="truncate text-white/60">{user?.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-brand-secondary/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-blush">
            Role: {user?.role}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Store className="h-4 w-4" />
            Lihat Storefront
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-300 hover:bg-rose-500/15"
          >
            <LogOut className="h-4 w-4" />
            Keluar Admin
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F7F3F0] text-ink-primary">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-ink-primary/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ModeBanner />
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line-subtle bg-surface-card/95 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-ink-primary hover:bg-surface-muted lg:hidden"
              aria-label="Buka navigasi admin"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-serif text-xl font-semibold text-brand-primary">
              Abadikala Studio Admin
            </span>
          </div>
          <Link to="/" className="btn-secondary py-1.5 text-xs">
            Buka Website
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
