import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const tg = (WebApp as any).default || WebApp;

let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
if (apiUrl && !apiUrl.startsWith('http')) {
  apiUrl = `https://${apiUrl}`;
}

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

// Admin Auth
export const authenticateWithTelegram = async () => {
  try {
    const initData = tg.initData;
    if (!initData) {
      console.warn("No initData found (Not in Telegram Environment)");
      // Bypass for testing purposes
      localStorage.setItem('jwt_token', 'mock_test_token');
      return { 
        id: 0, 
        full_name: "Test Foydalanuvchi", 
        balance: "100.00",
        telegram_id: 123456
      };
    }
    
    try {
      const response = await api.post('/api/auth/telegram', { initData });
      const { access_token, user } = response.data;
      localStorage.setItem('jwt_token', access_token);
      return user;
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.message;
      console.error("Auth failed:", errorDetail);
      throw new Error(errorDetail);
    }
  } catch (error: any) {
    console.error("General Auth Error:", error.message);
    throw error;
  }
};

// ==========================================
// CUSTOMER API
// ==========================================

export const getCustomerUser = () => {
  if (tg.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  return { id: 123456789, first_name: 'Test', last_name: 'Customer' };
}

export const getCustomerMenu = async (restaurantId: number) => {
  const response = await api.get(`/api/menu/${restaurantId}`);
  return response.data;
};

export const createOrder = async (orderData: any) => {
  const response = await api.post('/api/orders/create', orderData);
  return response.data;
};

export const closeWebApp = () => {
  tg.close();
};
