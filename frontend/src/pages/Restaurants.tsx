import { useState, useEffect } from 'react';
import { Plus, X, Loader2, UtensilsCrossed } from 'lucide-react';
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

  const handleAddRestaurant = async () => {
    if (!restaurantName || !botToken) {
      setError('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post(`/api/restaurants/`, {
        owner_id: 0, // Not needed, backend uses JWT subject
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
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Restoranlar</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="!py-2 !px-4 !rounded-xl !text-sm"
        >
          <Plus size={16} /> Qo'shish
        </button>
      </div>

      <div className="space-y-4">
        {fetching ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : restaurants.length === 0 ? (
          <div className="glass-card flex items-center justify-between opacity-60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1E293B] flex items-center justify-center">
                <UtensilsCrossed className="text-[#94A3B8]" />
              </div>
              <div>
                <h3 className="font-semibold">Hech narsa yo'q</h3>
                <p className="text-xs text-[#94A3B8]">Yangi restoran qo'shing</p>
              </div>
            </div>
          </div>
        ) : (
          restaurants.map(r => (
            <div key={r.id} className="glass-card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <UtensilsCrossed className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-xs text-[#94A3B8]">@{r.bot_username || 'bot'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Restaurant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card w-full max-w-sm relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="!bg-transparent !p-2 absolute right-4 top-4 text-[#94A3B8] hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold mb-6 text-gradient">Yangi Restoran</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-2 uppercase tracking-wider">Restoran Nomi</label>
                <input 
                  type="text" 
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Masalan: Evos"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-2 uppercase tracking-wider">Bot Tokeni (@BotFather'dan)</label>
                <input 
                  type="text" 
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

            <button 
              onClick={handleAddRestaurant}
              disabled={loading}
              className="w-full justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Saqlash va Ulanish'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
