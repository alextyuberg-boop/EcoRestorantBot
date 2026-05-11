import { useState, useEffect } from 'react';
import { Plus, X, Loader2, UtensilsCrossed, ExternalLink, Trash2, MapPin } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
const tg = (WebApp as any).default || WebApp;
import { api } from '../api';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const fetchRestaurants = async () => {
    try {
      setFetching(true);
      const response = await api.get('/api/restaurants/');
      setRestaurants(response.data);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName || !botToken) {
      setError('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post(`/api/restaurants/`, {
        name: restaurantName,
        bot_token: botToken
      });
      
      setIsModalOpen(false);
      setRestaurantName('');
      setBotToken('');
      tg.showAlert("Restoran muvaffaqiyatli qo'shildi!");
      fetchRestaurants();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi. Bot tokenini tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Restoranlarim</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="!py-2 !px-4 !text-xs !rounded-xl !bg-primary/20 !text-primary !shadow-none hover:!bg-primary/30"
        >
          <Plus size={16} />
          Qo'shish
        </button>
      </div>

      {fetching && restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
          <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
          <p className="label-muted">Yuklanmoqda...</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="glass-card !py-12 text-center border-dashed border-white/10">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="text-text-dark" size={32} />
          </div>
          <p className="text-dim text-sm mb-6">Sizda hali restoranlar yo'q</p>
          <button onClick={() => setIsModalOpen(true)} className="mx-auto !text-sm">
            Birinchi restoranni qo'shish
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {restaurants.map((res) => (
            <div key={res.id} className="glass-card !p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <UtensilsCrossed size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none mb-1.5">{res.name}</h3>
                    <div className="flex items-center gap-1.5 text-dim">
                      <MapPin size={12} />
                      <span className="text-[10px] uppercase font-semibold tracking-wider">@{res.bot_username || 'eco_bot'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="!p-2 !w-9 !h-9 !rounded-lg !bg-white/5 !shadow-none hover:!bg-white/10 !text-dim">
                    <ExternalLink size={16} />
                  </button>
                  <button className="!p-2 !w-9 !h-9 !rounded-lg !bg-red-500/5 !shadow-none hover:!bg-red-500/20 !text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-deep bg-white/10 flex items-center justify-center text-[8px] font-bold">
                      {i}
                    </div>
                  ))}
                  <div className="pl-4 text-[10px] text-dim font-medium uppercase tracking-tighter self-center">
                    Faol holatda
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                  Online
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="glass-card w-full max-w-md relative z-10 animate-slide-up !p-8 border-white/10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold">Yangi Restoran</h3>
                <p className="text-sm text-dim">Filial ma'lumotlarini kiriting</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="!p-2 !w-10 !h-10 !rounded-full !bg-white/5 !text-dim hover:!text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddRestaurant} className="space-y-6">
              <div className="space-y-2">
                <label className="label-muted px-1">Restoran Nomi</label>
                <input 
                  type="text" 
                  placeholder="Masalan: Rayhon Milliy Taomlar"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label-muted px-1">Telegram Bot Token</label>
                <input 
                  type="password" 
                  placeholder="BotFather dan olingan token"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  required
                />
                <p className="text-[10px] text-dim px-1 italic">
                  * Har bir restoran uchun alohida bot ochish tavsiya etiladi
                </p>
              </div>
              {error && <p className="text-red-400 text-xs px-1 font-medium">{error}</p>}
              <button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : 'Saqlash va Ulanish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
