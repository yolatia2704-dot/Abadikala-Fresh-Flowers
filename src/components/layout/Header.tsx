import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ModeBanner } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useHomepageSections } from '@/hooks/useStoreQueries';

const NAV_ITEMS = [
  { to: '/', label: 'Beranda' },
  { to: '/shop', label: 'Produk' },
  { to: '/koleksi/fresh', label: 'Lini Segar' },
  { to: '/koleksi/preserved', label: 'Lini Abadi' },
  { to: '/custom-order', label: 'Custom Bouquet' },
  { to: '/about', label: 'Tentang Kami' },
  { to: '/contact', label: 'Kontak' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { user, isAdmin } = useAuth();
  const { totalItems, setDrawerOpen } = useCart();
  const { productIds } = useWishlist();
  const { data: sections } = useHomepageSections();

  const announcement = sections?.find((s) => s.section_key === 'announcement_bar');
  const announcementText =
    announcement?.is_active && typeof announcement.content?.text === 'string'
      ? announcement.content.text
      : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line-subtle bg-surface-base/95 backdrop-blur-md">
      <ModeBanner />
      {announcementText && (
        <div className="bg-brand-forest px-4 py-2 text-center text-xs font-medium tracking-wide text-[#F6F1E7]">
          {announcementText}
        </div>
      )}

      <div className="container-editorial flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2 text-ink-primary hover:bg-surface-muted lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" aria-label="Beranda Abadikala Fresh Flowers">
            <BrandLogo />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-blush text-brand-primary'
                    : 'text-ink-secondary hover:bg-surface-muted hover:text-ink-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="rounded-full p-2.5 text-ink-primary transition-colors hover:bg-surface-muted hover:text-brand-primary"
            aria-label="Cari produk"
          >
            <Search className="h-5 w-5" />
          </button>

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden items-center gap-1.5 rounded-full border border-brand-primary/30 bg-brand-blush/70 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-blush sm:inline-flex"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          <Link
            to={user ? '/akun' : '/login'}
            className="rounded-full p-2.5 text-ink-primary transition-colors hover:bg-surface-muted hover:text-brand-primary"
            aria-label={user ? 'Akun saya' : 'Masuk'}
          >
            <User className="h-5 w-5" />
          </Link>

          <Link
            to="/wishlist"
            className="relative rounded-full p-2.5 text-ink-primary transition-colors hover:bg-surface-muted hover:text-brand-primary"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {productIds.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-secondary px-1 text-[10px] font-bold text-white">
                {productIds.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-full p-2.5 text-ink-primary transition-colors hover:bg-surface-muted hover:text-brand-primary"
            aria-label="Buka keranjang belanja"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-line-subtle bg-surface-card py-3">
          <form onSubmit={handleSearch} className="container-editorial flex items-center gap-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari buket segar, pressed flower, mawar kubah kaca, wisuda..."
              className="input-field flex-1"
              autoFocus
            />
            <button type="submit" className="btn-primary py-2.5">
              Cari
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="btn-ghost px-3"
              aria-label="Tutup pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-ink-primary/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-surface-base p-6 shadow-elevated">
            <div className="flex items-center justify-between pb-6">
              <BrandLogo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-2 text-ink-secondary hover:bg-surface-muted"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-blush text-brand-primary'
                        : 'text-ink-primary hover:bg-surface-muted'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/lacak-pesanan"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-ink-primary hover:bg-surface-muted"
              >
                Lacak Pesanan
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white"
                >
                  Dashboard Admin
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
