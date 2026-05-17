import { useParams, useNavigate } from 'react-router-dom';
import { closeWebApp } from '../../api';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle } from 'lucide-react';

export default function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { tokens } = useTheme();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '75vh',
      textAlign: 'center',
      padding: '20px 24px',
      animation: 'fadeIn 0.4s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes scaleUp {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${tokens.accentBg}; }
          50%       { box-shadow: 0 0 0 16px transparent; }
        }
      `}</style>

      {/* Success Icon */}
      <div style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: tokens.accentBg,
        border: `3px solid ${tokens.accent}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        animation: 'scaleUp 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275), pulse 2s ease 0.6s infinite',
      }}>
        <CheckCircle size={52} color={tokens.accent} strokeWidth={2} />
      </div>

      <h1 style={{
        fontSize: 26,
        fontWeight: 800,
        color: tokens.text,
        marginBottom: 12,
        letterSpacing: '-0.02em',
      }}>
        Buyurtma qabul qilindi!
      </h1>

      <p style={{
        color: tokens.textMuted,
        fontSize: 15,
        lineHeight: 1.6,
        marginBottom: 12,
        maxWidth: 300,
      }}>
        Sizning{' '}
        <strong style={{ color: tokens.accent }}>#{orderId}</strong>{' '}
        raqamli buyurtmangiz muvaffaqiyatli rasmiylashtirildi.
      </p>

      <p style={{
        color: tokens.textFaint,
        fontSize: 13,
        marginBottom: 36,
        maxWidth: 280,
      }}>
        Tez orada restorandan tasdiqlash xabari keladi 🍽️
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => closeWebApp()}
          style={{
            background: tokens.accent,
            color: tokens.accentText,
            padding: '16px',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 6px 24px ${tokens.accentBgStrong}`,
            letterSpacing: '-0.01em',
          }}
        >
          Botga qaytish
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            color: tokens.textMuted,
            padding: '16px',
            borderRadius: 14,
            fontWeight: 600,
            fontSize: 15,
            border: `1px solid ${tokens.border}`,
            cursor: 'pointer',
          }}
        >
          Asosiy menyuga
        </button>
      </div>
    </div>
  );
}
