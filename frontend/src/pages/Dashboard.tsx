import { UtensilsCrossed, Wallet, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="glass-card bg-gradient-to-br from-primary/20 to-transparent border-primary/20 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wallet size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="label-muted">Mening Hisobim</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tighter text-white">
              {Number(user?.balance || 0).toLocaleString('uz-UZ')}
            </span>
            <span className="text-primary font-bold text-sm">UZS</span>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="!py-2.5 !px-5 !text-xs !rounded-xl !bg-white/10 !shadow-none hover:!bg-white/20">
              To'ldirish
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card !p-5 flex flex-col gap-1 border-white/5">
          <div className="flex items-center justify-between">
            <span className="label-muted !text-[10px]">Buyurtmalar</span>
            <TrendingUp size={14} className="text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight">0</span>
        </div>
        <div className="glass-card !p-5 flex flex-col gap-1 border-white/5">
          <div className="flex items-center justify-between">
            <span className="label-muted !text-[10px]">Daromad</span>
            <ArrowUpRight size={14} className="text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight">0</span>
        </div>
      </div>

      {/* Main Actions */}
      <div className="space-y-4 pt-2">
        <h2 className="label-muted px-2">Boshqaruv</h2>
        <div 
          className="glass-card flex items-center justify-between cursor-pointer group active:scale-[0.98]"
          onClick={() => navigate('/restaurants')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
              <UtensilsCrossed className="text-white" size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Mening Restoranlarim</h3>
              <p className="text-xs text-dim mt-0.5">Filiallarni boshqarish va qo'shish</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <ArrowUpRight size={20} className="text-dim group-hover:text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
