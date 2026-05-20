import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, Leaf } from 'lucide-react';
import { useCart, CartProvider } from '../../context/CartContext';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

/* ─── Inner Layout (has access to both contexts) ─── */
const CustomerLayoutInner = () => {
  const { totalItems, totalPrice } = useCart();
  const { theme, tokens, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isCartOrCheckout =
    location.pathname.includes('/cart') || location.pathname.includes('/checkout');

  const toggleTheme = () => {
    const nextMode = 
      theme.mode === 'light' ? 'dark' :
      theme.mode === 'dark' ? 'green' : 'light';
    setTheme({
      ...theme,
      mode: nextMode,
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: tokens.bg,
      color: tokens.text,
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      transition: 'background 0.3s, color 0.3s',
    }}>

      {/* ── Header ─────────────────────────────── */}
      <header style={{
        padding: '14px 20px',
        background: tokens.headerBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${tokens.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: tokens.shadow,
      }}>
        {/* Logo / Name */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: tokens.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 12px ${tokens.accentBgStrong}`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 21V12M12 12C12 12 8 10 8 5C8 3 9.5 2 11 2C12.5 2 12 3.5 12 5"
                stroke={tokens.accentText} strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 12C12 12 14 9.5 16 8C17.5 6.8 19 7 19 9C19 11 16 12 12 12"
                stroke={tokens.accentText} strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M15 21L15 17M13 21L13 17M17 21L17 17M13 17H17"
                stroke={tokens.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontWeight: 800,
            fontSize: 17,
            color: tokens.accent,
            letterSpacing: '-0.02em',
          }}>
            {theme.restaurantName}
          </span>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Temani o'zgartirish (Hozirgi: ${theme.mode})`}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: tokens.bgElevated,
              border: `1px solid ${tokens.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: tokens.textMuted,
              transition: 'all 0.2s',
            }}
          >
            {theme.mode === 'green' ? (
              <Leaf size={17} />
            ) : theme.mode === 'dark' ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>

          {/* Cart Button */}
          {!isCartOrCheckout && (
            <div
              onClick={() => navigate('/cart')}
              style={{
                position: 'relative',
                background: totalItems > 0 ? tokens.accent : tokens.bgElevated,
                padding: '8px 14px',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: `1px solid ${totalItems > 0 ? tokens.accent : tokens.border}`,
                transition: 'all 0.2s',
                boxShadow: totalItems > 0 ? `0 4px 16px ${tokens.accentBgStrong}` : 'none',
              }}
            >
              <ShoppingCart
                size={17}
                color={totalItems > 0 ? tokens.accentText : tokens.textMuted}
              />
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: totalItems > 0 ? tokens.accentText : tokens.textMuted,
              }}>
                {totalPrice.toLocaleString()} so'm
              </span>
              {totalItems > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -7,
                  right: -7,
                  background: theme.mode === 'dark' ? '#FFF' : '#111',
                  color: theme.mode === 'dark' ? '#000' : '#FFF',
                  fontSize: 10,
                  fontWeight: 800,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: tokens.shadow,
                }}>
                  {totalItems}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content ─────────────────────────── */}
      <main style={{
        flex: 1,
        padding: '20px 16px',
        paddingBottom: 100,
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        <Outlet />
      </main>

      {/* ── Bottom gradient fade ──────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: `linear-gradient(to top, ${tokens.bg}, transparent)`,
        pointerEvents: 'none',
        zIndex: 10,
      }} />
    </div>
  );
};

/* ─── Exported Layout — wraps both providers ─── */
export default function CustomerLayout({ restaurantId }: { restaurantId: number }) {
  return (
    <ThemeProvider restaurantId={restaurantId}>
      <CartProvider>
        <CustomerLayoutInner />
      </CartProvider>
    </ThemeProvider>
  );
}
