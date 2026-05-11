import { useParams, useNavigate } from 'react-router-dom';
import { closeWebApp } from '../../api';
import { CheckCircle } from 'lucide-react';

export default function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      textAlign: 'center',
      padding: 20
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(0,229,97,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        animation: 'scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <CheckCircle size={48} color="#00E561" />
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        Buyurtma qabul qilindi!
      </h1>
      
      <p style={{ color: '#888', fontSize: 16, lineHeight: 1.5, marginBottom: 32 }}>
        Sizning <b>#{orderId}</b> raqamli buyurtmangiz muvaffaqiyatli rasmiylashtirildi. 
        Tez orada restorandan tasdiqlash xabari keladi.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
        <button 
          onClick={() => closeWebApp()}
          style={{
            background: '#00E561', color: '#000',
            padding: '16px', borderRadius: 12,
            fontWeight: 800, fontSize: 16, border: 'none',
            cursor: 'pointer'
          }}
        >
          Botga qaytish
        </button>
        
        <button 
          onClick={() => navigate('/')}
          style={{
            background: 'transparent', color: '#FFF',
            padding: '16px', borderRadius: 12,
            fontWeight: 600, fontSize: 16, border: '1px solid #2A2A2A',
            cursor: 'pointer'
          }}
        >
          Asosiy menyuga
        </button>
      </div>

      <style>
        {`
          @keyframes scale-up {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
