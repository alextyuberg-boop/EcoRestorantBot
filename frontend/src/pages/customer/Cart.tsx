import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';

export default function Cart({ restaurantId }: { restaurantId: number }) {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100, gap: 16 }}>
        <div style={{ fontSize: 64 }}>🛒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Savatcha bo'sh</h2>
        <p style={{ color: '#888', textAlign: 'center' }}>Hali hech narsa qo'shmadingiz</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            marginTop: 20,
            background: '#00E561',
            color: '#000',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Menyuga qaytish
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Savatcha</h1>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cart.map((item) => (
          <div key={item.item_id} style={{
            background: '#111',
            borderRadius: 16,
            padding: 16,
            border: '1px solid #2A2A2A',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.name}</h3>
              <div style={{ color: '#00E561', fontWeight: 700, fontSize: 14 }}>
                {(item.price * item.qty).toLocaleString()} so'm
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.qty === 1 ? (
                <button 
                  onClick={() => removeFromCart(item.item_id)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(255,68,68,0.1)', border: 'none', color: '#FF4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <button 
                  onClick={() => updateQuantity(item.item_id, -1)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#1A1A1A', border: 'none', color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Minus size={16} />
                </button>
              )}
              
              <span style={{ fontSize: 16, fontWeight: 700, width: 20, textAlign: 'center' }}>{item.qty}</span>
              
              <button 
                onClick={() => updateQuantity(item.item_id, 1)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: '#00E561', border: 'none', color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 24,
        background: '#111',
        borderRadius: 20,
        padding: 20,
        border: '1px solid #2A2A2A'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#888' }}>
          <span>Mahsulotlar ({totalItems}):</span>
          <span>{totalPrice.toLocaleString()} so'm</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 18, fontWeight: 800 }}>
          <span>Jami:</span>
          <span style={{ color: '#00E561' }}>{totalPrice.toLocaleString()} so'm</span>
        </div>
        
        <button 
          onClick={() => navigate('/checkout')}
          style={{
            width: '100%',
            background: '#00E561',
            color: '#000',
            padding: '16px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 16,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Rasmiylashtirishga o'tish
        </button>
      </div>
    </div>
  );
}
