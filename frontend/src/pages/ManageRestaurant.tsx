import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ClipboardList, FolderOpen, Utensils, Settings, 
  Plus, Trash2, Edit, Loader2, Phone, MapPin, Eye, EyeOff, Save, CheckCircle
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';
const tg = (WebApp as any).default || WebApp;

import { 
  getRestaurant, updateRestaurantSettings,
  getAdminCategories, createAdminCategory, deleteAdminCategory,
  getAdminItems, createAdminItem, updateAdminItem, deleteAdminItem,
  getAdminOrders, updateOrderStatus, uploadFile
} from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function ManageRestaurant() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const rid = parseInt(restaurantId || '0');
  
  const { t, language } = useLanguage();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingItemPhoto, setUploadingItemPhoto] = useState(false);

  // Core loading states
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'categories' | 'items' | 'settings'>('orders');

  // Sub-data states
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Filter & modal states
  const [activeOrdersOnly, setActiveOrdersOnly] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  
  // Item Form State (for Create/Edit Modal)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image_url: '',
    is_available: true
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    address: '',
    delivery_fee: 0,
    min_order: 0,
    working_start: '09:00',
    working_end: '22:00',
    primary_color: '#00E561',
    theme: 'dark',
    is_active: true,
    logo_url: ''
  });

  // Load basic restaurant details
  useEffect(() => {
    if (!rid) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getRestaurant(rid);
        setRestaurant(data);
        setSettingsForm({
          name: data.name || '',
          address: data.address || '',
          delivery_fee: data.delivery_fee || 0,
          min_order: data.min_order || 0,
          working_start: data.working_start || '09:00',
          working_end: data.working_end || '22:00',
          primary_color: data.primary_color || '#00E561',
          theme: data.theme || 'dark',
          is_active: data.is_active ?? true,
          logo_url: data.logo_url || ''
        });
      } catch (err) {
        console.error("Failed to load restaurant settings:", err);
        tg.showAlert("Restoran ma'lumotlarini yuklab bo'lmadi.");
        navigate('/restaurants');
      } finally {
        setLoading(false);
      }
    })();
  }, [rid]);

  // Load tab-specific data
  useEffect(() => {
    if (loading || !rid) return;
    loadTabData();
  }, [activeTab, activeOrdersOnly, loading, rid]);

  const loadTabData = async () => {
    try {
      setFetchingData(true);
      if (activeTab === 'orders') {
        const data = await getAdminOrders(rid, activeOrdersOnly);
        setOrders(data);
      } else if (activeTab === 'categories') {
        const data = await getAdminCategories(rid);
        setCategories(data);
      } else if (activeTab === 'items') {
        const cats = await getAdminCategories(rid);
        setCategories(cats);
        const foods = await getAdminItems(rid);
        setItems(foods);
      }
    } catch (err) {
      console.error(`Failed to load tab data: ${activeTab}`, err);
    } finally {
      setFetchingData(false);
    }
  };

  // ── Orders logic ──
  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      tg.showAlert(`Buyurtma holati yangilandi: ${status.toUpperCase()}`);
      setSelectedOrder(null);
      loadTabData();
    } catch (err) {
      tg.showAlert("Holatni yangilashda xatolik.");
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    new: "Yangi",
    confirmed: "Tasdiqlangan",
    paid: "To'langan",
    cooking: "Tayyorlanmoqda",
    delivery: "Yetkazilmoqda",
    done: "Yakunlangan",
    cancelled: "Bekor qilingan"
  };

  // ── Categories logic ──
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setFetchingData(true);
      await createAdminCategory(rid, { name: newCatName.trim(), sort_order: categories.length });
      setNewCatName('');
      tg.showAlert("Kategoriya muvaffaqiyatli qo'shildi!");
      loadTabData();
    } catch (err: any) {
      console.error(err);
      tg.showAlert(err.response?.data?.detail || "Kategoriya qo'shishda xatolik.");
    } finally {
      setFetchingData(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Bu kategoriyani o'chirmoqchimisiz? Ichidagi barcha taomlar kategoriyasiz qoladi.")) return;
    try {
      setFetchingData(true);
      await deleteAdminCategory(id);
      loadTabData();
    } catch (err) {
      tg.showAlert("Kategoriyani o'chirishda xatolik.");
    } finally {
      setFetchingData(false);
    }
  };

  // ── Menu Items logic ──
  const openItemModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        category_id: item.category_id ? String(item.category_id) : '',
        image_url: item.image_url || '',
        is_available: item.is_available ?? true
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: 0,
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        image_url: '',
        is_available: true
      });
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemForm,
        category_id: itemForm.category_id ? parseInt(itemForm.category_id) : null,
        price: parseFloat(String(itemForm.price))
      };
      
      setFetchingData(true);
      if (editingItem) {
        await updateAdminItem(editingItem.id, payload);
        tg.showAlert("Taom muvaffaqiyatli yangilandi!");
      } else {
        await createAdminItem(rid, payload);
        tg.showAlert("Taom muvaffaqiyatli yaratildi!");
      }
      setIsItemModalOpen(false);
      loadTabData();
    } catch (err: any) {
      console.error(err);
      tg.showAlert(err.response?.data?.detail || "Saqlashda xatolik yuz berdi.");
    } finally {
      setFetchingData(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Bu taomni ro'yxatdan butunlay o'chirib tashlaysizmi?")) return;
    try {
      setFetchingData(true);
      await deleteAdminItem(id);
      loadTabData();
    } catch (err) {
      tg.showAlert("Taomni o'chirishda xatolik.");
    } finally {
      setFetchingData(false);
    }
  };

  // ── Settings logic ──
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFetchingData(true);
      const res = await updateRestaurantSettings(rid, {
        ...settingsForm,
        delivery_fee: parseFloat(String(settingsForm.delivery_fee)),
        min_order: parseFloat(String(settingsForm.min_order))
      });
      setRestaurant(res);
      tg.showAlert("Restoran sozlamalari muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      console.error(err);
      tg.showAlert(err.response?.data?.detail || "Sozlamalarni saqlashda xatolik yuz berdi.");
    } finally {
      setFetchingData(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await uploadFile(file);
      setSettingsForm(prev => ({ ...prev, logo_url: res.url }));
      tg.showAlert("Logo muvaffaqiyatli yuklandi!");
    } catch (err: any) {
      console.error(err);
      tg.showAlert(err.response?.data?.detail || "Rasm yuklashda xatolik yuz berdi.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleItemPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingItemPhoto(true);
      const res = await uploadFile(file);
      setItemForm(prev => ({ ...prev, image_url: res.url }));
      tg.showAlert("Taom rasmi muvaffaqiyatli yuklandi!");
    } catch (err: any) {
      console.error(err);
      tg.showAlert(err.response?.data?.detail || "Rasm yuklashda xatolik yuz berdi.");
    } finally {
      setUploadingItemPhoto(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: 14, color: 'var(--color-text-3)' }}>Boshqaruv yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-icon" onClick={() => navigate('/restaurants')} style={{ width: 36, height: 36 }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            {restaurant?.name}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
            @{restaurant?.bot_username || 'bot'} boshqaruvi
          </p>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div style={{
        display: 'flex',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 4,
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'orders', label: t('tab_orders'), icon: ClipboardList },
          { id: 'categories', label: t('tab_categories'), icon: FolderOpen },
          { id: 'items', label: t('tab_items'), icon: Utensils },
          { id: 'settings', label: t('tab_settings'), icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 12px',
                fontSize: 12,
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#000' : 'var(--color-text-2)',
                boxShadow: isActive ? 'var(--glow-sm)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="page-enter">
        {fetchingData && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
          </div>
        )}

        {/* ──────── TABS 1: ORDERS ──────── */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-muted">Buyurtmalar oqimi</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => setActiveOrdersOnly(true)} 
                  className={activeOrdersOnly ? 'tag active' : 'tag'}
                  style={{ padding: '6px 12px', fontSize: 11 }}
                >
                  Faollar
                </button>
                <button 
                  onClick={() => setActiveOrdersOnly(false)} 
                  className={!activeOrdersOnly ? 'tag active' : 'tag'}
                  style={{ padding: '6px 12px', fontSize: 11 }}
                >
                  Barchasi
                </button>
              </div>
            </div>

            {/* List */}
            {orders.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <ClipboardList size={36} color="var(--color-text-3)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
                  Hozircha buyurtmalar mavjud emas.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map((order) => {
                  let badgeClass = 'badge-pending';
                  if (order.status === 'done' || order.status === 'confirmed') badgeClass = 'badge-done';
                  if (order.status === 'cooking') badgeClass = 'badge-cooking';
                  if (order.status === 'delivery') badgeClass = 'badge-delivery';
                  if (order.status === 'paid') badgeClass = 'badge-paid';

                  return (
                    <div 
                      key={order.id} 
                      className="card" 
                      onClick={() => setSelectedOrder(order)}
                      style={{ padding: 14, cursor: 'pointer', borderLeft: '4px solid var(--color-primary)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>
                            Buyurtma #{order.id}
                          </span>
                          <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>
                            {new Date(order.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`badge ${badgeClass}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginBottom: 8 }}>
                        {order.items.map((it: any) => `${it.qty} × ${it.name}`).join(', ')}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                          📞 {order.phone || 'Telefon kiritilmagan'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                          {Number(order.total_amount).toLocaleString()} so'm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ──────── TABS 2: CATEGORIES ──────── */}
        {activeTab === 'categories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span className="label-muted">{t('cats_title')}</span>
            {/* Form */}
            <form onSubmit={handleAddCategory} className="card" style={{ display: 'flex', gap: 10, padding: 12 }}>
              <input 
                type="text" 
                placeholder={t('cats_name_placeholder')}
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', fontSize: 14 }}
              />
              <button type="submit" style={{ padding: '0 16px', borderRadius: 'var(--radius-md)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={16} /> {t('cats_add_btn')}
              </button>
            </form>

            {/* List */}
            {categories.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-3)', padding: 30 }}>
                {language === 'en' ? 'No categories yet.' : language === 'ru' ? 'Категорий пока нет.' : 'Kategoriyalar hali yo\'q.'}
              </p>
            ) : (
              <div className="card" style={{ padding: '4px 16px' }}>
                {categories.map((cat, i) => (
                  <div 
                    key={cat.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 0',
                      borderBottom: i === categories.length - 1 ? 'none' : '1px solid var(--color-border)' 
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{cat.name}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="btn-danger btn-icon"
                      style={{ width: 32, height: 32, padding: 0 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────── TABS 3: MENU ITEMS ──────── */}
        {activeTab === 'items' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-muted">
                {language === 'en' ? `${items.length} dishes` : language === 'ru' ? `${items.length} блюд` : `${items.length} ta taom`}
              </span>
              <button onClick={() => openItemModal(null)} style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={14} /> {t('items_new')}
              </button>
            </div>

            {items.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
                <Utensils size={36} color="var(--color-text-3)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
                  {language === 'en' ? 'No dishes available yet. Add a new dish.' : language === 'ru' ? 'Блюд пока нет. Добавьте первое блюдо.' : 'Taomlar mavjud emas. Yangi taom kiriting.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((item) => (
                  <div key={item.id} className="card" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {/* Image Preview */}
                      <div style={{
                        width: 50, height: 50, borderRadius: 10,
                        background: item.image_url ? `url(${item.image_url}) center/cover` : 'var(--color-surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {!item.image_url && <Utensils size={18} color="var(--color-text-3)" />}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }} className="text-truncate">
                            {item.name}
                          </span>
                          {!item.is_available && (
                            <span className="badge" style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', fontSize: 8, padding: '2px 6px' }}>
                              {language === 'en' ? 'Inactive' : language === 'ru' ? 'Неактивно' : 'Faolmas'}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>
                          {categories.find(c => c.id === item.category_id)?.name || (language === 'en' ? 'Uncategorized' : language === 'ru' ? 'Без категории' : 'Kategoriyasiz')}
                        </p>
                      </div>

                      {/* Price & Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--color-primary)' }}>
                          {Number(item.price).toLocaleString()} {t('dash_sum')}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn-icon" 
                            style={{ width: 28, height: 28 }}
                            onClick={() => openItemModal(item)}
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            className="btn-danger btn-icon" 
                            style={{ width: 28, height: 28, background: 'rgba(255,68,68,0.06)' }}
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────── TABS 4: SETTINGS ──────── */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
            <div>
              <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>{t('rest_name')}</label>
              <input 
                type="text" 
                value={settingsForm.name} 
                onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>{t('rest_address')}</label>
              <input 
                type="text" 
                value={settingsForm.address} 
                onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                placeholder="Toshkent sh., Chilonzor tumani"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>{t('rest_min_order_form')}</label>
                <input 
                  type="number" 
                  value={settingsForm.min_order} 
                  onChange={e => setSettingsForm({ ...settingsForm, min_order: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>{t('rest_delivery_fee')}</label>
                <input 
                  type="number" 
                  value={settingsForm.delivery_fee} 
                  onChange={e => setSettingsForm({ ...settingsForm, delivery_fee: Number(e.target.value) })}
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>{t('rest_working_start')} ("09:00")</label>
                <input 
                  type="text" 
                  value={settingsForm.working_start} 
                  onChange={e => setSettingsForm({ ...settingsForm, working_start: e.target.value })}
                  placeholder="09:00"
                />
              </div>
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>{t('rest_working_end')} ("22:00")</label>
                <input 
                  type="text" 
                  value={settingsForm.working_end} 
                  onChange={e => setSettingsForm({ ...settingsForm, working_end: e.target.value })}
                  placeholder="22:00"
                />
              </div>
            </div>

            {/* Branding - Theme and Color Presets */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span className="label-muted" style={{ display: 'block', marginBottom: 4 }}>{t('rest_branding_title')}</span>
              
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 8 }}>{t('rest_logo_url')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text" 
                    value={settingsForm.logo_url} 
                    onChange={e => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    style={{ flex: 1 }}
                  />
                  <label className="btn" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '0 16px',
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)'
                  }}>
                    {uploadingLogo ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      t('rest_logo_upload')
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>
                {settingsForm.logo_url && (
                  <div style={{ marginTop: 10, position: 'relative', width: 80, height: 80, borderRadius: 12, border: '1px solid var(--color-border)', background: `url(${settingsForm.logo_url}) center/cover` }} />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{t('rest_theme')}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'dark', label: language === 'en' ? 'Dark' : language === 'ru' ? 'Темная' : 'Qora (Dark)' },
                    { id: 'light', label: language === 'en' ? 'Light' : language === 'ru' ? 'Светлая' : 'Oq (Light)' },
                    { id: 'green', label: language === 'en' ? 'Green' : language === 'ru' ? 'Зеленая' : 'Yashil (Green)' }
                  ].map(tInfo => (
                    <button
                      type="button"
                      key={tInfo.id}
                      onClick={() => setSettingsForm({ ...settingsForm, theme: tInfo.id })}
                      className={settingsForm.theme === tInfo.id ? 'tag active' : 'tag'}
                      style={{ fontSize: 11, padding: '6px 10px' }}
                    >
                      {tInfo.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 10 }}>{t('rest_accent')}</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { hex: '#00E561', name: 'Neon Green' },
                    { hex: '#007AFF', name: 'Blue' },
                    { hex: '#5856D6', name: 'Purple' },
                    { hex: '#FF9500', name: 'Orange' },
                    { hex: '#FF3B30', name: 'Red' },
                    { hex: '#E0E0E8', name: 'Minimal' }
                  ].map(color => (
                    <button
                      type="button"
                      key={color.hex}
                      onClick={() => setSettingsForm({ ...settingsForm, primary_color: color.hex })}
                      style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: color.hex,
                        border: settingsForm.primary_color === color.hex ? '3px solid #FFF' : '1px solid var(--color-border)',
                        padding: 0,
                        boxShadow: settingsForm.primary_color === color.hex ? '0 0 12px rgba(255,255,255,0.4)' : 'none',
                        cursor: 'pointer'
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{t('rest_is_active')}</span>
              <button
                type="button"
                className={settingsForm.is_active ? 'tag active' : 'tag'}
                onClick={() => setSettingsForm({ ...settingsForm, is_active: !settingsForm.is_active })}
                style={{ fontSize: 12, display: 'flex', gap: 4 }}
              >
                {settingsForm.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>
                  {settingsForm.is_active 
                    ? (language === 'en' ? 'Active (Online)' : language === 'ru' ? 'Активен (Онлайн)' : 'Faol (Online)') 
                    : (language === 'en' ? 'Disabled (Offline)' : language === 'ru' ? 'Отключен (Офлайн)' : 'O\'chirilgan (Offline)')}
                </span>
              </button>
            </div>

            <button 
              type="submit" 
              style={{ width: '100%', padding: '14px 24px', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Save size={16} /> {language === 'en' ? 'Save Settings' : language === 'ru' ? 'Сохранить настройки' : 'Sozlamalarni Saqlash'}
            </button>
          </form>
        )}
      </div>

      {/* ── Modal: Order Details ── */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', padding: '0 0 env(safe-area-inset-bottom)' }} className="animate-fade">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }} onClick={() => setSelectedOrder(null)} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, margin: '0 auto',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', overflowY: 'auto', maxHeight: '85vh'
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 16px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                Buyurtma #{selectedOrder.id}
              </h3>
              <button className="tag" onClick={() => setSelectedOrder(null)} style={{ padding: '6px 12px', fontSize: 11 }}>
                Yopish
              </button>
            </div>

            {/* Client info */}
            <div className="card" style={{ background: 'var(--color-surface-2)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span className="label-muted">Mijoz telefon:</span>
                {selectedOrder.phone ? (
                  <a href={`tel:${selectedOrder.phone}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} /> {selectedOrder.phone}
                  </a>
                ) : <span style={{ color: 'var(--color-text-3)' }}>Mavjud emas</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13 }}>
                <span className="label-muted" style={{ marginTop: 2 }}>Manzil:</span>
                <span style={{ color: 'var(--color-text-2)', flex: 1 }}>{selectedOrder.delivery_address || 'Kiritilmagan'}</span>
              </div>

              {selectedOrder.location_lat && selectedOrder.location_lon && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.location_lat},${selectedOrder.location_lon}`}
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    fontSize: 12, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, 
                    textDecoration: 'none', marginTop: 4, fontWeight: 600
                  }}
                >
                  <MapPin size={12} /> Xaritada ochish (Google Maps)
                </a>
              )}
            </div>

            {/* Food items list */}
            <div style={{ marginBottom: 20 }}>
              <span className="label-muted" style={{ display: 'block', marginBottom: 10 }}>Taomlar</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedOrder.items.map((it: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>{it.qty} × {it.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{(it.price * it.qty).toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Jami summa:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 800, color: 'var(--color-primary)' }}>
                  {Number(selectedOrder.total_amount).toLocaleString()} so'm
                </span>
              </div>
            </div>

            {/* Status updates buttons */}
            <span className="label-muted" style={{ display: 'block', marginBottom: 12 }}>Holatni yangilash</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {selectedOrder.status === 'new' && (
                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')} style={{ fontSize: 13, padding: '12px' }}>
                  <CheckCircle size={14} /> Qabul qilish
                </button>
              )}
              {selectedOrder.status === 'confirmed' && (
                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'cooking')} style={{ fontSize: 13, padding: '12px' }}>
                  🧑‍🍳 Pishirishni boshlash
                </button>
              )}
              {selectedOrder.status === 'cooking' && (
                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'delivery')} style={{ fontSize: 13, padding: '12px' }}>
                  🚴 Yo'lga chiqarish
                </button>
              )}
              {selectedOrder.status === 'delivery' && (
                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'done')} style={{ fontSize: 13, padding: '12px' }}>
                  ✅ Yakunlash
                </button>
              )}

              {selectedOrder.status !== 'done' && selectedOrder.status !== 'cancelled' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')} 
                  className="btn-danger"
                  style={{ fontSize: 13, padding: '12px', gridColumn: selectedOrder.status === 'paid' ? 'span 2' : 'auto' }}
                >
                  ❌ Bekor qilish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add/Edit Menu Item ── */}
      {isItemModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', padding: '0 0 env(safe-area-inset-bottom)' }} className="animate-fade">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }} onClick={() => setIsItemModalOpen(false)} />
          <form 
            onSubmit={handleSaveItem}
            style={{
              position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, margin: '0 auto',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', overflowY: 'auto', maxHeight: '85vh',
              display: 'flex', flexDirection: 'column', gap: 14
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 12px' }} />
            
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {editingItem ? t('items_edit') : t('items_new')}
            </h3>

            <div>
              <label className="label-muted" style={{ display: 'block', marginBottom: 6 }}>{t('items_name')}</label>
              <input 
                type="text" 
                value={itemForm.name} 
                onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label-muted" style={{ display: 'block', marginBottom: 6 }}>{t('items_desc')}</label>
              <textarea 
                value={itemForm.description} 
                onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder={language === 'en' ? 'e.g. Delicious grilled chicken with special sauce.' : language === 'ru' ? 'Например: Вкусная курица-гриль со специальным соусом.' : 'Masalan: Tovuq go\'shti, pishloq, maxsus sous bilan.'}
                style={{ height: 60 }}
              />
            </div>

            {categories.length === 0 ? (
              <div style={{
                background: 'rgba(255, 150, 0, 0.08)',
                border: '1px solid rgba(255, 150, 0, 0.25)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 0 16px rgba(255, 150, 0, 0.05)',
                margin: '6px 0'
              }}>
                <span style={{ fontSize: 13, color: '#FFB03A', fontWeight: 500, lineHeight: 1.5 }}>
                  {t('items_no_cat_warn')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setActiveTab('categories');
                  }}
                  style={{
                    padding: '10px 20px',
                    fontSize: 12,
                    background: 'var(--color-primary)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--glow-sm)'
                  }}
                >
                  {t('items_go_cat_btn')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label-muted" style={{ display: 'block', marginBottom: 6 }}>{t('items_price')}</label>
                  <input 
                    type="number" 
                    value={itemForm.price || ''} 
                    onChange={e => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="label-muted" style={{ display: 'block', marginBottom: 6 }}>{t('items_cat')}</label>
                  <select 
                    value={itemForm.category_id}
                    onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                    required
                  >
                    <option value="">{language === 'en' ? 'Choose...' : language === 'ru' ? 'Выбрать...' : 'Tanlang...'}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="label-muted" style={{ display: 'block', marginBottom: 6 }}>{t('items_image')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  value={itemForm.image_url} 
                  onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                  placeholder="https://example.com/food.jpg"
                  style={{ flex: 1 }}
                />
                <label className="btn" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '0 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)'
                }}>
                  {uploadingItemPhoto ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    t('items_upload_btn')
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleItemPhotoUpload}
                    disabled={uploadingItemPhoto}
                  />
                </label>
              </div>
              {itemForm.image_url && (
                <div style={{ marginTop: 10, width: 80, height: 80, borderRadius: 12, border: '1px solid var(--color-border)', background: `url(${itemForm.image_url}) center/cover` }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{t('items_available')}</span>
              <button
                type="button"
                className={itemForm.is_available ? 'tag active' : 'tag'}
                onClick={() => setItemForm({ ...itemForm, is_available: !itemForm.is_available })}
                style={{ fontSize: 12 }}
              >
                {itemForm.is_available 
                  ? (language === 'en' ? 'Yes (Available)' : language === 'ru' ? 'Да (Доступно)' : 'Mavjud') 
                  : (language === 'en' ? 'No (Sold Out)' : language === 'ru' ? 'Нет (Закончилось)' : 'Tugagan')}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button 
                type="button" 
                className="btn-ghost" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setIsItemModalOpen(false)}
              >
                {t('items_cancel')}
              </button>
              <button 
                type="submit" 
                style={{ flex: 1, padding: '12px' }}
                disabled={categories.length === 0}
              >
                <Save size={14} /> {language === 'en' ? 'Save' : language === 'ru' ? 'Сохранить' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
