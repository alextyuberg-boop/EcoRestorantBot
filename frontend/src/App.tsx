import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authenticateWithTelegram } from './api';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Restaurants from './pages/Restaurants';
import Settings from './pages/Settings';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authenticateWithTelegram();
        if (userData) {
          setUser(userData);
        } else {
          setError("Telegram orqali avtorizatsiya amalga oshmadi.");
        }
      } catch (err) {
        setError("Server bilan ulanishda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-darker)]">
        <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
        <p className="text-[#94A3B8]">Tizimga kirilmoqda...</p>
      </div>
    );
  }

  if (error && !user) {
    // If not in Telegram or auth failed, we can show an error or a mock dashboard for testing
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-darker)]">
        <div className="glass-card text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Xatolik</h2>
          <p className="text-[#94A3B8]">{error}</p>
          <p className="text-xs text-[#94A3B8] mt-4">Ilovani Telegram orqali ochganingizga ishonch hosil qiling.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="restaurants" element={<Restaurants />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
