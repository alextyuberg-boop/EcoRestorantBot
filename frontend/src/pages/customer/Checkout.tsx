import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { createOrder, getCustomerUser, closeWebApp } from '../../api';
import { ArrowLeft, MapPin, Phone, CreditCard, Banknote } from 'lucide-react';

export default function Checkout({ restaurantId }: { restaurantId: number }) {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' or 'card'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (cart.length === 0) {
    navigate('/');
    return null;
  }

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
          price: item.price
        })),
        total_amount: totalPrice,
        phone: phone,
        delivery_address: address,
        payment_type: paymentType
      };

      const result = await createOrder(orderData);
      
      clearCart();
      navigate(`/status/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Zakaz yaratishda xatolik yuz berdi');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/cart')}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Rasmiylashtirish</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Phone Input */}
        <div>
          <label style={{ display: 'block', fontSize: 14, color: '#888', marginBottom: 8 }}>Telefon raqam</label>
          <div style={{
            display: 'flex', alignItems: 'center', background: '#111', 
            border: '1px solid #2A2A2A', borderRadius: 12, padding: '0 16px'
          }}>
            <Phone size={18} color="#888" />
            <input 
              type="tel" 
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', color: '#FFF', 
                padding: '16px 12px', fontSize: 16, outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Address Input */}
        <div>
          <label style={{ display: 'block', fontSize: 14, color: '#888', marginBottom: 8 }}>Yetkazib berish manzili</label>
          <div style={{
            display: 'flex', alignItems: 'flex-start', background: '#111', 
            border: '1px solid #2A2A2A', borderRadius: 12, padding: '16px'
          }}>
            <MapPin size={18} color="#888" style={{ marginTop: 2 }} />
            <textarea 
              placeholder="Shahar, ko'cha, uy raqami, mo'ljal..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              style={{
                flex: 1, background: 'transparent', border: 'none', color: '#FFF', 
                padding: '0 12px', fontSize: 16, outline: 'none', resize: 'none'
              }}
            />
          </div>
        </div>

        {/* Payment Type */}
        <div>
          <label style={{ display: 'block', fontSize: 14, color: '#888', marginBottom: 8 }}>To'lov turi</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <div 
              onClick={() => setPaymentType('cash')}
              style={{
                flex: 1, padding: 16, borderRadius: 12, border: `1px solid ${paymentType === 'cash' ? '#00E561' : '#2A2A2A'}`,
                background: paymentType === 'cash' ? 'rgba(0,229,97,0.1)' : '#111',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Banknote size={24} color={paymentType === 'cash' ? '#00E561' : '#888'} />
              <span style={{ fontSize: 14, fontWeight: 600, color: paymentType === 'cash' ? '#00E561' : '#888' }}>Naqd pul</span>
            </div>
            
            <div 
              onClick={() => setPaymentType('card')}
              style={{
                flex: 1, padding: 16, borderRadius: 12, border: `1px solid ${paymentType === 'card' ? '#00E561' : '#2A2A2A'}`,
                background: paymentType === 'card' ? 'rgba(0,229,97,0.1)' : '#111',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <CreditCard size={24} color={paymentType === 'card' ? '#00E561' : '#888'} />
              <span style={{ fontSize: 14, fontWeight: 600, color: paymentType === 'card' ? '#00E561' : '#888' }}>Karta orqali</span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ color: '#FF4444', fontSize: 14, textAlign: 'center', padding: 8, background: 'rgba(255,68,68,0.1)', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          style={{
            marginTop: 12,
            width: '100%',
            background: '#00E561',
            color: '#000',
            padding: '16px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 16,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Yuborilmoqda..." : `Buyurtma berish (${totalPrice.toLocaleString()} so'm)`}
        </button>
      </form>
    </div>
  );
}
