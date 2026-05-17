import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { createOrder, getCustomerUser } from '../../api';
import { ArrowLeft, MapPin, Phone, CreditCard, Banknote, ChevronRight } from 'lucide-react';

export default function Checkout({ restaurantId }: { restaurantId: number }) {
  const { cart, totalPrice, clearCart } = useCart();
  const { tokens } = useTheme();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (cart.length === 0) {
    navigate('/');
    return null;
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    background: tokens.bgElevated,
    border: `1.5px solid ${tokens.border}`,
    color: tokens.text,
    fontSize: 15,
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !address) {
      setError("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const customer = getCustomerUser();
      const orderData = {
        restaurant_id: restaurantId,
        user_id: customer.id,
        items: cart.map(item => ({
          item_id: item.item_id,
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        total_amount: totalPrice,
        phone,
        delivery_address: address,
        payment_type: paymentType,
      };

      const result = await createOrder(orderData);
      clearCart();
      navigate(`/status/${result.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, textarea:focus { border-color: ${tokens.accent} !important; }
      `}</style>

      {/* Back + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => navigate('/cart')}
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: tokens.text, margin: 0 }}>Rasmiylashtirish</h1>
          <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0 }}>Yetkazish ma'lumotlari</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Phone */}
        <div style={{
          background: tokens.bgCard,
          borderRadius: 16,
          padding: 16,
          border: `1px solid ${tokens.border}`,
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: tokens.textMuted,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 10,
          }}>
            <Phone size={14} />
            Telefon raqam
          </label>
          <input
            type="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Address */}
        <div style={{
          background: tokens.bgCard,
          borderRadius: 16,
          padding: 16,
          border: `1px solid ${tokens.border}`,
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: tokens.textMuted,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 10,
          }}>
            <MapPin size={14} />
            Yetkazish manzili
          </label>
          <textarea
            placeholder="Shahar, ko'cha, uy raqami..."
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />
        </div>

        {/* Payment Type */}
        <div style={{
          background: tokens.bgCard,
          borderRadius: 16,
          padding: 16,
          border: `1px solid ${tokens.border}`,
        }}>
          <label style={{
            color: tokens.textMuted,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: 12,
          }}>
            To'lov usuli
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              { value: 'cash', label: "Naqd pul", icon: Banknote },
              { value: 'card', label: "Plastik karta", icon: CreditCard },
            ] as const).map(({ value, label, icon: Icon }) => {
              const isSelected = paymentType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentType(value)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    background: isSelected ? tokens.accentBg : tokens.bgElevated,
                    border: `2px solid ${isSelected ? tokens.accent : tokens.border}`,
                    color: isSelected ? tokens.accent : tokens.textMuted,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={22} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{
          background: tokens.bgCard,
          borderRadius: 16,
          padding: 16,
          border: `1px solid ${tokens.border}`,
        }}>
          <p style={{ color: tokens.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Buyurtma
          </p>
          {cart.map(item => (
            <div key={item.item_id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 14,
              color: tokens.text,
            }}>
              <span style={{ color: tokens.textMuted }}>{item.name} × {item.qty}</span>
              <span style={{ fontWeight: 700 }}>{(item.price * item.qty).toLocaleString()} so'm</span>
            </div>
          ))}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${tokens.border}`,
            fontSize: 17,
            fontWeight: 800,
            color: tokens.text,
          }}>
            <span>Jami:</span>
            <span style={{ color: tokens.accent }}>{totalPrice.toLocaleString()} so'm</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,70,70,0.08)',
            border: '1px solid rgba(255,70,70,0.25)',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#FF4646',
            fontSize: 14,
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? tokens.bgElevated : tokens.accent,
            color: loading ? tokens.textMuted : tokens.accentText,
            padding: '17px',
            borderRadius: 16,
            fontWeight: 800,
            fontSize: 16,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : `0 6px 24px ${tokens.accentBgStrong}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            letterSpacing: '-0.01em',
            transition: 'all 0.2s',
            marginBottom: 32,
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${tokens.textFaint}`,
                borderTopColor: tokens.accent,
                animation: 'spin 0.8s linear infinite',
              }} />
              Yuborilmoqda...
            </>
          ) : (
            <>
              Buyurtma berish
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
