import { useState, useEffect } from 'react';
import { getCustomerMenu } from '../../api';
import { useCart } from '../../context/CartContext';
import { Plus, Minus } from 'lucide-react';

export default function Menu({ restaurantId }: { restaurantId: number }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { cart, addToCart, updateQuantity } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const data = await getCustomerMenu(restaurantId);
        setCategories(data);
        if (data.length > 0) setActiveTab(data[0].id);
      } catch (err: any) {
        setError('Menyu yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50, color: '#00E561' }}>
        Yuklanmoqda...
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>
        {error || "Menyu hozircha bo'sh"}
      </div>
    );
  }

  const activeCategory = categories.find(c => c.id === activeTab);

  return (
    <div>
      {/* Categories Horizontal Scroll */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: 12,
        paddingBottom: 16,
        marginBottom: 20,
        scrollbarWidth: 'none',
      }}>
        {categories.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveTab(c.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: activeTab === c.id ? '#00E561' : '#1A1A1A',
              color: activeTab === c.id ? '#000' : '#FFF',
              fontWeight: 600,
              fontSize: 14,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: `1px solid ${activeTab === c.id ? '#00E561' : '#2A2A2A'}`
            }}
          >
            {c.name}
          </div>
        ))}
      </div>

      {/* Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16
      }}>
        {activeCategory?.items?.map((item: any) => {
          const cartItem = cart.find(i => i.item_id === item.id);
          const qty = cartItem ? cartItem.qty : 0;

          return (
            <div key={item.id} style={{
              background: '#111',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid #2A2A2A',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Item Image Placeholder */}
              <div style={{
                height: 120,
                background: '#1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#444'
              }}>
                {item.image_file_id ? (
                  <div style={{ fontSize: 10, textAlign: 'center' }}>Rasm mavjud emas<br/>(Telegram File ID)</div>
                ) : (
                  <span style={{ fontSize: 32 }}>🍽️</span>
                )}
              </div>
              
              <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.name}</h3>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 12, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description || 'Taom haqida ma\'lumot'}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#00E561' }}>
                    {item.price.toLocaleString()} so'm
                  </div>
                  
                  {qty === 0 ? (
                    <button 
                      onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: '#1A1A1A', border: '1px solid #2A2A2A',
                        color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: '#1A1A1A', border: 'none', color: '#FFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 600, width: 16, textAlign: 'center' }}>{qty}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: '#00E561', border: 'none', color: '#000',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Plus size={14} />
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
