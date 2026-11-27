import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminGuard, CustomerGuard } from '@/routes/Guards';

// Eagerly loaded primary entry pages for crisp UX
import { HomePage } from '@/pages/public/HomePage';
import { ShopPage } from '@/pages/public/ShopPage';
import { ProductDetailPage } from '@/pages/public/ProductDetailPage';

// Route-based code splitting for secondary and admin pages
const CartPage = lazy(() => import('@/pages/public/CartPage').then((m) => ({ default: m.CartPage })));
const WishlistPage = lazy(() => import('@/pages/public/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const CheckoutPage = lazy(() => import('@/pages/public/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CustomOrderPage = lazy(() => import('@/pages/public/CustomOrderPage').then((m) => ({ default: m.CustomOrderPage })));
const OrderTrackingPage = lazy(() => import('@/pages/public/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })));
const AboutPage = lazy(() => import('@/pages/public/InfoPages').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/pages/public/InfoPages').then((m) => ({ default: m.ContactPage })));
const FaqPage = lazy(() => import('@/pages/public/InfoPages').then((m) => ({ default: m.FaqPage })));
const CareGuidePage = lazy(() => import('@/pages/public/InfoPages').then((m) => ({ default: m.CareGuidePage })));
const OrderGuidePage = lazy(() => import('@/pages/public/InfoPages').then((m) => ({ default: m.OrderGuidePage })));
const LegalPolicyPage = lazy(() => import('@/pages/public/InfoPages').then((m) => ({ default: m.LegalPolicyPage })));
const NotFoundPage = lazy(() => import('@/pages/public/InfoPages').then((m) => ({ default: m.NotFoundPage })));

const LoginPage = lazy(() => import('@/pages/auth/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/AuthPages').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));
const AdminLoginPage = lazy(() => import('@/pages/auth/AuthPages').then((m) => ({ default: m.AdminLoginPage })));
const CustomerAccountPage = lazy(() => import('@/pages/customer/CustomerAccountPage').then((m) => ({ default: m.CustomerAccountPage })));

const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminInventoryPage = lazy(() => import('@/pages/admin/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage })));
const AdminCustomOrdersPage = lazy(() => import('@/pages/admin/AdminCustomOrdersPage').then((m) => ({ default: m.AdminCustomOrdersPage })));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage })));
const AdminCmsPage = lazy(() => import('@/pages/admin/AdminCmsPage').then((m) => ({ default: m.AdminCmsPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center text-sm text-ink-secondary">
      Memuat halaman Abadikala...
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Storefront & Customer Routes */}
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/koleksi/:line" element={<ShopPage />} />
                      <Route path="/produk/:slug" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/custom-order" element={<CustomOrderPage />} />
                      <Route path="/custom" element={<CustomOrderPage />} />
                      <Route path="/lacak-pesanan" element={<OrderTrackingPage />} />
                      <Route path="/track" element={<OrderTrackingPage />} />
                      <Route path="/track-order" element={<OrderTrackingPage />} />
                      {/* Canonical Information & Legal Routes */}
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/faq" element={<FaqPage />} />
                      <Route path="/care-guide" element={<CareGuidePage />} />
                      <Route path="/privacy-policy" element={<LegalPolicyPage type="privacy" />} />
                      <Route path="/terms" element={<LegalPolicyPage type="terms" />} />
                      <Route path="/shipping-policy" element={<LegalPolicyPage type="shipping" />} />
                      <Route path="/cancellation-policy" element={<LegalPolicyPage type="cancellation" />} />
                      {/* Indonesian Route Aliases (backward-compatible) */}
                      <Route path="/tentang-kami" element={<AboutPage />} />
                      <Route path="/kontak" element={<ContactPage />} />
                      <Route path="/panduan-perawatan" element={<CareGuidePage />} />
                      <Route path="/panduan-pemesanan" element={<OrderGuidePage />} />
                      <Route path="/kebijakan-privasi" element={<LegalPolicyPage type="privacy" />} />
                      <Route path="/syarat-ketentuan" element={<LegalPolicyPage type="terms" />} />
                      <Route path="/kebijakan-pengiriman" element={<LegalPolicyPage type="shipping" />} />
                      <Route path="/kebijakan-pembatalan" element={<LegalPolicyPage type="cancellation" />} />
                      <Route path="/404" element={<NotFoundPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/lupa-password" element={<ForgotPasswordPage />} />
                      <Route
                        path="/akun"
                        element={
                          <CustomerGuard>
                            <CustomerAccountPage />
                          </CustomerGuard>
                        }
                      />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>

                    {/* Admin Auth & Protected Dashboard */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminGuard>
                          <AdminLayout />
                        </AdminGuard>
                      }
                    >
                      <Route index element={<AdminOverviewPage />} />
                      <Route path="produk" element={<AdminProductsPage />} />
                      <Route path="kategori" element={<AdminCategoriesPage />} />
                      <Route path="pesanan" element={<AdminOrdersPage />} />
                      <Route path="stok" element={<AdminInventoryPage />} />
                      <Route path="custom-order" element={<AdminCustomOrdersPage />} />
                      <Route path="pelanggan" element={<AdminCustomersPage />} />
                      <Route path="konten" element={<AdminCmsPage />} />
                      <Route path="pengaturan" element={<AdminSettingsPage />} />
                      <Route path="laporan" element={<AdminReportsPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
