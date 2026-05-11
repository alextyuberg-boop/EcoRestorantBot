import { UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card flex flex-col gap-2">
          <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Buyurtmalar</span>
          <span className="text-2xl font-bold">0</span>
        </div>
        <div className="glass-card flex flex-col gap-2">
          <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Mening Hisobim</span>
          <span className="text-2xl font-bold text-primary">{user?.balance || '0.00'} UZS</span>
        </div>
      </div>

      {/* Main Actions */}
      <div className="space-y-4">
        <div 
          className="glass-card flex items-center justify-between cursor-pointer"
          onClick={() => navigate('/restaurants')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <UtensilsCrossed className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Mening Restoranlarim</h3>
              <p className="text-xs text-[#94A3B8]">Restoranlarni boshqarish</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
