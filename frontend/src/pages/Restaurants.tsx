import { useState, useEffect } from 'react';
import { Plus, X, Loader2, UtensilsCrossed, Trash2, ExternalLink, MapPin } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
const tg = (WebApp as any).default || WebApp;
import { api } from '../api';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [botToken, setBotToken]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(true);
  const [error, setError]               = useState('');

  const fetchRestaurants = async () => {
    try {
      setFetching(true);
      const res = await api.get('/api/restaurants/');
      setRestaurants(res.data);
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchRestaurants(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/restaurants/', { name: restaurantName, bot_token: botToken });
      setIsModalOpen(false);
      setRestaurantName('');
      setBotToken('');
      tg.showAlert("Restoran muvaffaqiyatli qo'shildi!");
      fetchRestaurants();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Xatolik yuz berdi. Bot tokenini tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>
            Restoranlarim
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 2 }}>
            {restaurants.length} ta restoran
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{
          padding: '10px 16px',
          fontSize: 13,
          borderRadius: 'var(--radius-md)',
          fontWeight: 700,
        }}>
          <Plus size={16} /> Qo'shish
        </button>
      </div>

      {/* ── List ── */}
      {fetching ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: 88, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'var(--color-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-3)',
          }}>
            <UtensilsCrossed size={28} />
          </div>
          <p style={{ color: 'var(--color-text-3)', fontSize: 14, marginBottom: 20 }}>
            Sizda hali restoranlar yo'q
          </p>
          <button onClick={() => setIsModalOpen(true)} style={{ fontSize: 14, padding: '12px 24px' }}>
            Birinchi restoranni qo'shish
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {restaurants.map((res, idx) => (
            <div
              key={res.id}
              className="card"
              style={{
                padding: 16,
                animationDelay: `${idx * 80}ms`,
                animationFillMode: 'both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Icon */}
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 12,
                  background: 'rgba(0,229,97,0.1)',
                  border: '1px solid rgba(0,229,97,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-primary)',
                  flexShrink: 0,
                }}>
                  <UtensilsCrossed size={22} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700, fontSize: 16,
                    color: 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {res.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <MapPin size={11} color="var(--color-text-3)" />
                    <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                      @{res.bot_username || 'eco_bot'}
                    </span>
                  </div>
                </div>

                {/* Status + Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span className="badge badge-online">Online</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-icon" style={{ width: 32, height: 32 }}>
                      <ExternalLink size={14} />
                    </button>
                    <button className="btn-danger btn-icon" style={{
                      width: 32, height: 32,
                      background: 'rgba(255,68,68,0.06)',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer strip */}
              <div style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                  0 ta buyurtma bugun
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                }}>
                  0 UZS
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'flex-end',
          padding: '0 0 env(safe-area-inset-bottom)',
        }}
          className="animate-fade"
        >
          {/* Overlay */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsModalOpen(false)}
          />

          {/* Sheet */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 480, margin: '0 auto',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderBottom: 'none',
            borderRadius: '24px 24px 0 0',
            padding: '28px 20px 36px',
          }}>
            {/* Handle */}
            <div style={{
              width: 36, height: 4,
              borderRadius: 2,
              background: 'var(--color-border)',
              margin: '0 auto 24px',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
                  Yangi Restoran
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 4 }}>
                  Bot va restoran ma'lumotlarini kiriting
                </p>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>
                  Restoran Nomi
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Rayhon Milliy Taomlar"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  placeholder="@BotFather'dan olingan token"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  required
                />
                <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 6 }}>
                  * Har bir restoran uchun alohida bot tavsiya etiladi
                </p>
              </div>

              {error && (
                <p style={{ color: '#FF4444', fontSize: 13, fontWeight: 500 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', marginTop: 8, padding: '15px 24px' }}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Saqlash va Ulanish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
