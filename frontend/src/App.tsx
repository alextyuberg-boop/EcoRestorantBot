import { Component, useState, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { authenticateApp } from './api';

// Admin Pages
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Restaurants from './pages/Restaurants';
import Settings from './pages/Settings';
import ManageRestaurant from './pages/ManageRestaurant';

// Customer Pages
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerMenu from './pages/customer/Menu';
import CustomerCart from './pages/customer/Cart';
import CustomerCheckout from './pages/customer/Checkout';
import OrderStatus from './pages/customer/OrderStatus';

/* ─── Error Boundary ────────────────────────────── */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: 24,
          background: '#0A0A0A', gap: 16,
        }}>
          <div style={{
            padding: 20, borderRadius: 16,
            background: '#111', border: '1px solid #2A2A2A',
            maxWidth: 360, width: '100%',
          }}>
            <h1 style={{ fontWeight: 700, fontSize: 18, color: '#FF4444', marginBottom: 12 }}>
              Ilova ishga tushmadi
            </h1>
            <pre style={{
              background: '#0A0A0A', padding: 12,
              borderRadius: 8, fontSize: 11,
              color: '#888', overflow: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {this.state.error?.message}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Splash/Loading Screen ────────────────────── */
function SplashScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#000000', gap: 16,
    }}>
      <div className="logo-icon" style={{
        width: 80, height: 80,
        borderRadius: 20,
        background: '#00E561',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
          <path d="M12 21V12M12 12C12 12 8 10 8 5C8 3 9.5 2 11 2C12.5 2 12 3.5 12 5" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 12C12 12 14 9.5 16 8C17.5 6.8 19 7 19 9C19 11 16 12 12 12" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
          <path d="M15 21L15 17M13 21L13 17M17 21L17 17M13 17H17" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{
        fontFamily: 'var(--font-display, sans-serif)',
        fontWeight: 800,
        fontSize: 24,
        color: '#00E561',
        letterSpacing: '-0.03em',
        textShadow: '0 0 20px rgba(0,229,97,0.5)',
      }}>
        EcoRestaurant
      </div>

      <div style={{
        width: 160, height: 2,
        background: '#1A1A1A',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0,
          height: '100%',
          background: '#00E561',
          animation: 'progress-line 1.5s ease-in-out infinite alternate',
          width: '60%',
        }} />
      </div>
    </div>
  );
}

/* ─── Error Screen ─────────────────────────────── */
function ErrorScreen({ error }: { error: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: 20,
      background: '#000000', gap: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: '#111', border: '1px solid #2A2A2A',
        borderRadius: 20, padding: 24,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'rgba(255,68,68,0.1)',
          border: '1px solid rgba(255,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, marginBottom: 16,
        }}>
          ⚠️
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: '#FFFFFF', marginBottom: 8 }}>
          Xatolik
        </h2>
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 16 }}>
          {error}
        </p>
        <p style={{ fontSize: 12, color: '#555' }}>
          Ilovani Telegram orqali ochganingizga ishonch hosil qiling.
        </p>
      </div>
    </div>
  );
}

/* ─── App Logic ─────────────────────────────────── */
function AppRouter() {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurant_id') || new URLSearchParams(window.location.search).get('restaurant_id');

  // App State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!restaurantId) {
          setError("Noto'g'ri havola. Iltimos, bot orqali kiring.");
          setLoading(false);
          return;
        }

        const rid = parseInt(restaurantId);
        const userData = await authenticateApp(rid);
        if (userData) {
          setUser(userData);
        } else {
          setError('Telegram orqali avtorizatsiya amalga oshmadi.');
        }
      } catch (err: any) {
        setError(err.message || 'Server bilan ulanishda xatolik yuz berdi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  if (loading) return <SplashScreen />;
  if (error) return <ErrorScreen error={error} />;

  const rid = parseInt(restaurantId as string);

  if (user?.role === 'owner') {
    // ──────── OWNER APP (Admin Panel) ────────
    return (
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="restaurants" element={<Restaurants />} />
          <Route path="settings" element={<Settings />} />
          <Route path="manage/:restaurantId" element={<ManageRestaurant />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  // ──────── CUSTOMER APP ────────
  return (
    <Routes>
      <Route path="/" element={<CustomerLayout restaurantId={rid} />}>
        <Route index element={<CustomerMenu restaurantId={rid} />} />
        <Route path="cart" element={<CustomerCart restaurantId={rid} />} />
        <Route path="checkout" element={<CustomerCheckout restaurantId={rid} />} />
        <Route path="status/:orderId" element={<OrderStatus />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </ErrorBoundary>
  );
}
