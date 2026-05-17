import { useState, useEffect } from 'react';
import { getCustomerMenu } from '../../api';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Minus, UtensilsCrossed } from 'lucide-react';

export default function Menu({ restaurantId }: { restaurantId: number }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { cart, addToCart, updateQuantity } = useCart();
  const { tokens } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const data = await getCustomerMenu(restaurantId);
        setCategories(data);
        if (data.length > 0) setActiveTab(data[0].id);
      } catch {
        setError("Menyu yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        gap: 16,
      }}>
        {/* Animated dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: tokens.accent,
              animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <span style={{ color: tokens.textMuted, fontSize: 14 }}>Menyu yuklanmoqda...</span>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 24px',
        color: tokens.textMuted,
      }}>
        <UtensilsCrossed size={48} color={tokens.textFaint} style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: tokens.text }}>
          {error || "Menyu hozircha bo'sh"}
        </p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Keyinroq qayta urinib ko'ring</p>
      </div>
    );
  }

  const activeCategory = categories.find(c => c.id === activeTab);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .food-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
        .add-btn:active { transform: scale(0.92); }
      `}</style>

      {/* ── Category Tabs ─────────────────────────── */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: 10,
        paddingBottom: 4,
        marginBottom: 24,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {categories.map((c) => {
          const isActive = activeTab === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              style={{
                padding: '9px 18px',
                borderRadius: 30,
                background: isActive ? tokens.accent : tokens.bgCard,
                color: isActive ? tokens.accentText : tokens.textMuted,
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `1.5px solid ${isActive ? tokens.accent : tokens.border}`,
                boxShadow: isActive ? `0 4px 16px ${tokens.accentBgStrong}` : 'none',
                flexShrink: 0,
              }}
            >
              {c.name}
            </div>
          );
        })}
      </div>

      {/* ── Items Grid ────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: 14,
      }}>
        {activeCategory?.items?.map((item: any) => {
          const cartItem = cart.find(i => i.item_id === item.id);
          const qty = cartItem ? cartItem.qty : 0;

          return (
            <div
              key={item.id}
              className="food-card"
              style={{
                background: tokens.bgCard,
                borderRadius: 18,
                overflow: 'hidden',
                border: `1px solid ${qty > 0 ? tokens.accent : tokens.border}`,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.22s ease',
                boxShadow: qty > 0 ? `0 4px 20px ${tokens.accentBg}` : tokens.shadow,
              }}
            >
              {/* Image Area */}
              <div style={{
                height: 130,
                background: item.image_url
                  ? `url(${item.image_url}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${tokens.bgElevated} 0%, ${tokens.bgCard} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {!item.image_url && (
                  <span style={{ fontSize: 42, filter: 'grayscale(0.2)' }}>🍽️</span>
                )}
                {!item.is_available && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      color: '#fff', fontWeight: 700, fontSize: 13,
                      background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 20,
                    }}>Mavjud emas</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '12px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: tokens.text,
                  lineHeight: 1.3,
                  margin: 0,
                }}>
                  {item.name}
                </h3>
                {item.description && (
                  <p style={{
                    fontSize: 11,
                    color: tokens.textMuted,
                    margin: 0,
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4,
                  }}>
                    {item.description}
                  </p>
                )}

                {/* Price + Cart Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: tokens.accent,
                    letterSpacing: '-0.01em',
                  }}>
                    {item.price.toLocaleString()}
                    <span style={{ fontSize: 10, fontWeight: 600, color: tokens.textMuted, marginLeft: 2 }}>so'm</span>
                  </span>

                  {qty === 0 ? (
                    <button
                      className="add-btn"
                      onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: tokens.accent,
                        border: 'none',
                        color: tokens.accentText,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s',
                        boxShadow: `0 4px 12px ${tokens.accentBg}`,
                      }}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: tokens.bgElevated,
                          border: `1px solid ${tokens.border}`,
                          color: tokens.text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: tokens.accent,
                        minWidth: 18,
                        textAlign: 'center',
                      }}>
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: tokens.accent,
                          border: 'none',
                          color: tokens.accentText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
