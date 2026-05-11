import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Settings, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  user: any;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard },
    { path: '/restaurants', icon: UtensilsCrossed },
    { path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen p-6 animate-fade-in relative pb-32">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gradient">EcoRestorant</h1>
          <p className="text-sm text-[#94A3B8]">Xush kelibsiz, {user?.full_name || 'Mehmon'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
          <UserIcon className="text-primary" size={20} />
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 glass-card !p-2 flex items-center justify-around z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`!bg-transparent !p-2 !w-12 !h-12 !rounded-xl transition-colors ${
                isActive ? 'text-primary bg-primary/10' : 'text-[#94A3B8] hover:text-primary'
              }`}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
