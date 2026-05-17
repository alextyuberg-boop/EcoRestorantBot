import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';

export default function Cart({ restaurantId: _restaurantId }: { restaurantId: number }) {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const { tokens } = useTheme();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
        gap: 16,
        padding: 32,
        animation: 'fadeIn 0.3s ease',
      }}>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: tokens.bgElevated,
          border: `2px dashed ${tokens.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ShoppingBag size={36} color={tokens.textFaint} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: tokens.text, margin: '0 0 8px' }}>
            Savatcha bo'sh
          </h2>
          <p style={{ color: tokens.textMuted, fontSize: 14, margin: 0 }}>
            Hali hech narsa qo'shmadingiz
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 8,
            background: tokens.accent,
            color: tokens.accentText,
            padding: '13px 28px',
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 6px 20px ${tokens.accentBgStrong}`,
          }}
        >
          Menyuga qaytish
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, animation: 'fadeIn 0.3s ease' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>

      {/* Back button + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: tokens.bgElevated,
            border: `1px solid ${tokens.border}`,
            color: tokens.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: tokens.text, margin: 0 }}>Savatcha</h1>
          <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0 }}>
            {totalItems} ta mahsulot
          </p>
        </div>
      </div>

      {/* Cart Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {cart.map((item) => (
          <div key={item.item_id} style={{
            background: tokens.bgCard,
            borderRadius: 16,
            padding: '14px 16px',
            border: `1px solid ${tokens.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: tokens.shadow,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: 15,
                fontWeight: 700,
                color: tokens.text,
                margin: '0 0 4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.name}
              </h3>
              <span style={{ color: tokens.accent, fontWeight: 700, fontSize: 15 }}>
                {(item.price * item.qty).toLocaleString()}
                <span style={{ color: tokens.textMuted, fontWeight: 500, fontSize: 12, marginLeft: 3 }}>so'm</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {item.qty === 1 ? (
                <button
                  onClick={() => removeFromCart(item.item_id)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'rgba(255,70,70,0.10)',
                    border: '1px solid rgba(255,70,70,0.20)',
                    color: '#FF4646',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <button
                  onClick={() => updateQuantity(item.item_id, -1)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: tokens.bgElevated,
                    border: `1px solid ${tokens.border}`,
                    color: tokens.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Minus size={16} />
                </button>
              )}

              <span style={{
                fontSize: 17,
                fontWeight: 800,
                color: tokens.text,
                width: 24,
                textAlign: 'center',
              }}>
                {item.qty}
              </span>

              <button
                onClick={() => updateQuantity(item.item_id, 1)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: tokens.accent,
                  border: 'none',
                  color: tokens.accentText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px ${tokens.accentBg}`,
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div style={{
        background: tokens.bgCard,
        borderRadius: 20,
        padding: 20,
        border: `1px solid ${tokens.border}`,
        boxShadow: tokens.shadow,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 10,
          color: tokens.textMuted,
          fontSize: 14,
        }}>
          <span>Mahsulotlar ({totalItems})</span>
          <span>{totalPrice.toLocaleString()} so'm</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 18,
          fontWeight: 800,
          color: tokens.text,
          paddingTop: 12,
          borderTop: `1px solid ${tokens.border}`,
          marginBottom: 20,
        }}>
          <span>Jami:</span>
          <span style={{ color: tokens.accent }}>{totalPrice.toLocaleString()} so'm</span>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          style={{
            width: '100%',
            background: tokens.accent,
            color: tokens.accentText,
            padding: '16px',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 6px 20px ${tokens.accentBgStrong}`,
            letterSpacing: '-0.01em',
          }}
        >
          Rasmiylashtirishga o'tish →
        </button>
      </div>
    </div>
  );
}
