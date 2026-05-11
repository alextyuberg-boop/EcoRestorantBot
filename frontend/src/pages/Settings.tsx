import { Settings as SettingsIcon, Globe, HelpCircle, ChevronRight, Bell, Shield, LogOut } from 'lucide-react';

const MenuRow = ({ icon: Icon, label, sub, danger = false }: {
  icon: any; label: string; sub?: string; danger?: boolean;
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 0',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
  }}>
    <div style={{
      width: 36, height: 36,
      borderRadius: 'var(--radius-sm)',
      background: danger ? 'rgba(255,68,68,0.08)' : 'rgba(0,229,97,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: danger ? '#FF4444' : 'var(--color-primary)',
      flexShrink: 0,
    }}>
      <Icon size={18} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 15, fontWeight: 600,
        color: danger ? '#FF4444' : 'var(--color-text)',
        fontFamily: 'var(--font-display)',
      }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>{sub}</div>}
    </div>
    <ChevronRight size={16} color="var(--color-text-3)" />
  </div>
);

export default function Settings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Title ── */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
          Sozlamalar
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 3 }}>
          Ilova va profil sozlamalari
        </p>
      </div>

      {/* ── Language card ── */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="label-muted" style={{ marginBottom: 14 }}>Til sozlamalari</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {["O'zbekcha", "Русский", "English"].map((lang, i) => (
            <button
              key={lang}
              className={i === 0 ? 'tag active' : 'tag'}
              style={{ fontSize: 13 }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu List ── */}
      <div className="card" style={{ padding: '4px 20px' }}>
        <MenuRow icon={Bell}    label="Bildirishnomalar" sub="Push va tovush sozlamalari" />
        <MenuRow icon={Globe}   label="Hudud va valyuta"  sub="UZS · O'zbekiston" />
        <MenuRow icon={Shield}  label="Xavfsizlik"        sub="Parol va 2FA" />
        <MenuRow icon={HelpCircle} label="Yordam markazi" sub="FAQ va texnik qo'llab-quvvatlash" />
      </div>

      {/* ── Danger ── */}
      <div className="card" style={{ padding: '4px 20px', borderColor: 'rgba(255,68,68,0.15)' }}>
        <MenuRow icon={LogOut} label="Chiqish" danger />
      </div>

      {/* ── Version ── */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{
            width: 20, height: 20,
            borderRadius: 5,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SettingsIcon size={12} color="#000" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
            EcoRestaurant
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          Design System v1.0 · Admin Panel
        </p>
      </div>
    </div>
  );
}
