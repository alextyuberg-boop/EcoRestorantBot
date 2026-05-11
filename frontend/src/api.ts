import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: apiUrl,
});

// Interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authenticateWithTelegram = async () => {
  try {
    const initData = WebApp.initData;
    if (!initData) {
      console.warn("No initData found (Not in Telegram Environment)");
      // Bypass for testing purposes
      return { 
        id: 0, 
        full_name: "Test Foydalanuvchi", 
        balance: "100.00",
        telegram_id: 123456
      };
    }
    
    const response = await api.post('/api/auth/telegram', { initData });
    const { access_token, user } = response.data;
    
    // Save token
    localStorage.setItem('jwt_token', access_token);
    return user;
  } catch (error) {
    console.error("Auth failed:", error);
    throw error;
  }
};
