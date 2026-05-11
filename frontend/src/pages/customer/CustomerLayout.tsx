import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart, CartProvider } from '../../context/CartContext';

const CustomerLayoutInner = () => {
  const { totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isCartOrCheckout = location.pathname.includes('/cart') || location.pathname.includes('/checkout');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      color: '#FFFFFF',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px',
        background: 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2A2A2A',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div 
          onClick={() => navigate('/')}
          style={{ 
            fontWeight: 800, 
            fontSize: 20, 
            color: '#00E561',
            cursor: 'pointer'
          }}
        >
          EcoRestaurant
        </div>
        
        {!isCartOrCheckout && (
          <div 
            onClick={() => navigate('/cart')}
            style={{
              position: 'relative',
              background: '#1A1A1A',
              padding: '8px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #2A2A2A'
            }}
          >
            <ShoppingCart size={18} color={totalItems > 0 ? '#00E561' : '#888'} />
            <span style={{ fontSize: 14, fontWeight: 600, color: totalItems > 0 ? '#FFF' : '#888' }}>
              {totalPrice.toLocaleString()} so'm
            </span>
            {totalItems > 0 && (
              <div style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#00E561',
                color: '#000',
                fontSize: 10,
                fontWeight: 800,
                width: 18,
                height: 18,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {totalItems}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px', paddingBottom: '100px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default function CustomerLayout() {
  return (
    <CartProvider>
      <CustomerLayoutInner />
    </CartProvider>
  );
}
