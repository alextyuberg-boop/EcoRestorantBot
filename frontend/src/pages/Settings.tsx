import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, HelpCircle, ChevronRight, 
  Bell, LogOut, CreditCard, Phone, User, Loader2, Save 
} from 'lucide-react';
import { updateOwnerProfile } from '../api';
import WebApp from '@twa-dev/sdk';
import { useLanguage } from '../context/LanguageContext';
import type { LanguageCode } from '../context/LanguageContext';

const tg = (WebApp as any).default || WebApp;

const langLabelToCode: Record<string, string> = {
  "O'zbekcha": "uz",
  "Русский": "ru",
  "English": "en"
};

const MenuRow = ({ icon: Icon, label, sub, danger = false, onClick }: {
  icon: any; label: string; sub?: string; danger?: boolean; onClick?: () => void;
}) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 0',
      borderBottom: '1px solid var(--color-border)',
      cursor: 'pointer',
    }}
  >
    <div style={{
      width: 36, height: 36,
      borderRadius: 'var(--radius-sm)',
      background: danger ? 'rgba(255,68,68,0.08)' : 'rgba(0,229,97,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: danger ? '#FF4444' : 'var(--color-primary)',
      flexShrink: 0,
    }}>
      <Icon size={18} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 15, fontWeight: 600,
        color: danger ? '#FF4444' : 'var(--color-text)',
        fontFamily: 'var(--font-display)',
      }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>{sub}</div>}
    </div>
    <ChevronRight size={16} color="var(--color-text-3)" />
  </div>
);

export default function Settings() {
  const { t, language: currentLangCode, setLanguage: setGlobalLanguage } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setFetching(true);
        const data = await updateOwnerProfile({});
        if (data) {
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setCardNumber(data.card_number || '');
          if (data.language) {
            setGlobalLanguage(data.language as LanguageCode);
          }
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await updateOwnerProfile({
        full_name: fullName,
        phone: phone,
        card_number: cardNumber,
        language: currentLangCode,
      });
      if (data) {
        tg.showAlert(t('settings_save_success'));
      }
    } catch (err: any) {
      console.error(err);
      tg.showAlert(err.response?.data?.detail || t('settings_save_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* ── Title ── */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>
          {t('settings_title')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 3 }}>
          {t('settings_sub')}
        </p>
      </div>

      {fetching ? (
        <div className="card" style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 className="animate-spin" size={24} color="var(--color-primary)" />
          <span style={{ marginLeft: 10, fontSize: 14, color: 'var(--color-text-3)' }}>{t('dash_loading')}</span>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Card Preview */}
          <div style={{
            background: 'linear-gradient(135deg, #00E561 0%, #009e43 100%)',
            borderRadius: 20,
            padding: 20,
            color: '#000000',
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: '1.586',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 12px 30px rgba(0, 229, 97, 0.15)',
          }}>
            {/* Glossy Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
              pointerEvents: 'none',
            }} />

            {/* Card Chip & Network */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
              <div style={{
                width: 44, height: 32,
                background: 'rgba(0,0,0,0.18)',
                borderRadius: 6,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ width: '80%', height: '70%', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4 }} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
                EcoPay
              </div>
            </div>

            {/* Card Number */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              letterSpacing: '0.12em',
              fontWeight: 700,
              margin: '18px 0',
              textAlign: 'center',
              zIndex: 1,
            }}>
              {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '8600 •••• •••• ••••'}
            </div>

            {/* Card Holder & Phone */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
              <div style={{ minWidth: 0, flex: 1, marginRight: 16 }}>
                <div style={{ fontSize: 8, textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em', fontWeight: 600 }}>
                  {t('settings_card_holder')}
                </div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 700, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  textTransform: 'uppercase',
                  marginTop: 2
                }}>
                  {fullName || 'TO\'LIQ ISM'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 8, textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em', fontWeight: 600 }}>
                  {t('settings_card_phone')}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                  {phone || '+998 •• ••• •• ••'}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Card / Form inputs */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="label-muted" style={{ marginBottom: 4 }}>{t('settings_profile_title')}</div>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-3)', marginBottom: 6 }}>
                {t('settings_owner_name')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder={t('settings_owner_name')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ paddingLeft: 40 }}
                />
                <User size={16} color="var(--color-text-3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-3)', marginBottom: 6 }}>
                {t('settings_phone')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="+998901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
                <Phone size={16} color="var(--color-text-3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Card Number */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-3)', marginBottom: 6 }}>
                {t('settings_card')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="8600123456789012"
                  value={cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                    setCardNumber(val);
                  }}
                  style={{ paddingLeft: 40, fontFamily: 'var(--font-mono)' }}
                />
                <CreditCard size={16} color="var(--color-text-3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 6 }}>
                {t('settings_card_tip')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                color: '#000',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Save size={18} /> {t('settings_save_btn')}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Language card ── */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="label-muted" style={{ marginBottom: 14 }}>{t('settings_language_title')}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {["O'zbekcha", "Русский", "English"].map((lang) => {
            const code = langLabelToCode[lang];
            const isActive = currentLangCode === code;
            return (
              <button
                key={lang}
                type="button"
                className={isActive ? 'tag active' : 'tag'}
                style={{ fontSize: 13 }}
                onClick={async () => {
                  setGlobalLanguage(code as LanguageCode);
                  try {
                    await updateOwnerProfile({ language: code });
                    const alertMsg = code === 'uz' ? "Til O'zbekcha rejimiga o'zgartirildi." : code === 'ru' ? "Язык изменен на Русский." : "Language changed to English.";
                    tg.showAlert(alertMsg);
                  } catch (err) {
                    console.error("Failed to update language on server:", err);
                  }
                }}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Menu List ── */}
      <div className="card" style={{ padding: '4px 20px' }}>
        <MenuRow icon={Bell}    label={t('settings_notifications')} sub={t('settings_notif_sub')} onClick={() => tg.showAlert(t('settings_notif_alert'))} />
        <MenuRow icon={HelpCircle} label={t('settings_help_center')} sub={t('settings_help_sub')} onClick={() => tg.openTelegramLink("https://t.me/EcoRestorant_Bot?start=help")} />
      </div>

      {/* ── Danger ── */}
      <div className="card" style={{ padding: '4px 20px', borderColor: 'rgba(255,68,68,0.15)' }}>
        <MenuRow icon={LogOut} label={t('settings_logout')} danger onClick={() => {
          tg.showAlert(t('settings_logout_alert'));
        }} />
      </div>

      {/* ── Version ── */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{
            width: 20, height: 20,
            borderRadius: 5,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SettingsIcon size={12} color="#000" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
            EcoRestaurant
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          Design System v1.0 · Admin Panel
        </p>
      </div>
    </div>
  );
}
