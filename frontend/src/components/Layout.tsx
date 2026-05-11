import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Settings, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  user: any;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Asosiy' },
    { path: '/restaurants', icon: UtensilsCrossed, label: 'Restoranlar' },
    { path: '/settings', icon: Settings, label: 'Sozlamalar' },
  ];

  return (
    <div className="min-h-screen p-6 animate-slide-up relative pb-32">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-gradient">EcoRestorant</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-medium text-dim uppercase tracking-wider uppercase">
              Xush kelibsiz, {user?.full_name?.split(' ')[0] || 'Mehmon'}
            </p>
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
          <UserIcon className="text-primary" size={22} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto">
        <Outlet />
      </main>

      {/* Premium Bottom Navigation */}
      <div className="fixed bottom-8 left-6 right-6 z-50 max-w-md mx-auto">
        <nav className="nav-blur h-20 rounded-[32px] flex items-center justify-around px-4 shadow-2xl border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`!bg-transparent !shadow-none !p-0 flex flex-col items-center gap-1.5 transition-all duration-300 ${
                  isActive ? 'text-primary scale-110' : 'text-text-dark hover:text-dim'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon size={isActive ? 26 : 24} />
                </div>
                {isActive && <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
