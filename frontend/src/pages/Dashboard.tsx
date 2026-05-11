import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed, TrendingUp, Wallet,
  ShoppingCart, ChefHat, Plus, ArrowRight
} from 'lucide-react';

interface DashboardProps { user: any; }

const StatCard = ({
  label, value, sub, icon: Icon, color = 'var(--color-primary)'
}: { label: string; value: string | number; sub?: string; icon: any; color?: string }) => (
  <div className="card-stat page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span className="label-muted">{label}</span>
      <div style={{
        width: 32, height: 32,
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(0,229,97,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon size={16} />
      </div>
    </div>
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 22,
      fontWeight: 700,
      color,
      letterSpacing: '-0.02em',
    }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 500 }}>
        {sub}
      </div>
    )}
  </div>
);

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Balance Hero Card ── */}
      <div className="card" style={{
        padding: 20,
        borderColor: 'var(--color-border-brand)',
        background: 'linear-gradient(135deg, #111111 0%, #0d1a0d 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* bg glow */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,97,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(0,229,97,0.12)',
            border: '1px solid rgba(0,229,97,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)',
          }}>
            <Wallet size={18} />
          </div>
          <span className="label-muted">Mening Hisobim</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--color-primary)',
            letterSpacing: '-0.03em',
            textShadow: '0 0 20px rgba(0,229,97,0.4)',
          }}>
            {Number(user?.balance || 0).toLocaleString('uz-UZ')}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-primary-mid)',
          }}>UZS</span>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn-secondary" style={{
            padding: '8px 18px',
            fontSize: 13,
            borderRadius: 'var(--radius-sm)',
          }}>
            Hisobni to'ldirish
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <StatCard label="Buyurtmalar" value="0" sub="Bugun" icon={ShoppingCart} />
        <StatCard label="Daromad" value="0" sub="Bugun, UZS" icon={TrendingUp} />
        <StatCard label="Aktiv" value="0" sub="Hozir tayyorlanmoqda" icon={ChefHat} />
        <StatCard label="O'rtacha chek" value="0" sub="UZS" icon={Wallet} />
      </div>

      {/* ── Divider ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
        <span className="label-muted">Boshqaruv</span>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
      </div>

      {/* ── Main Action: Restaurants ── */}
      <div
        className="card"
        onClick={() => navigate('/restaurants')}
        style={{ cursor: 'pointer', padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-md)',
            flexShrink: 0,
          }}>
            <UtensilsCrossed size={26} color="#000" strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 17,
              color: 'var(--color-text)',
              marginBottom: 3,
            }}>
              Mening Restoranlarim
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
              Filiallarni boshqarish va qo'shish
            </div>
          </div>
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'rgba(0,229,97,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)',
            flexShrink: 0,
          }}>
            <ArrowRight size={18} />
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Menyu qo\'shish', icon: Plus },
          { label: 'Statistika', icon: TrendingUp },
        ].map(({ label, icon: Icon }) => (
          <button key={label} className="btn-ghost" style={{
            padding: '14px 12px',
            fontSize: 13,
            borderRadius: 'var(--radius-md)',
          }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}
