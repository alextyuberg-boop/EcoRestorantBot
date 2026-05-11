import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Settings, Bell } from 'lucide-react';

interface LayoutProps {
  user: any;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/',            icon: LayoutDashboard, label: 'Asosiy' },
    { path: '/restaurants', icon: UtensilsCrossed, label: 'Restoranlar' },
    { path: '/settings',    icon: Settings,        label: 'Sozlamalar' },
  ];

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }} className="page-enter">
      {/* ── Header ── */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 40,
      }}>
        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo icon: plant + fork */}
          <div className="logo-icon" style={{
            width: 40, height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 21V12M12 12C12 12 8 10 8 5C8 3 9.5 2 11 2C12.5 2 12 3.5 12 5" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 12C12 12 14 9.5 16 8C17.5 6.8 19 7 19 9C19 11 16 12 12 12" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              <path d="M15 21L15 17M13 21L13 17M17 21L17 17M13 17H17" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--color-text)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}>
              EcoRestaurant
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <div className="neon-dot" />
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-text-3)',
              }}>
                {user?.full_name?.split(' ')[0] || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Notification Bell */}
        <button className="btn-icon" onClick={() => {}}>
          <Bell size={18} />
        </button>
      </header>

      {/* ── Page Content ── */}
      <main style={{
        padding: '20px 16px',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        <Outlet />
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              {isActive && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
