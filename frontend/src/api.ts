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

// App Auth (Unified for Owner and Customer inside Bot 2)
export const authenticateApp = async (restaurantId: number) => {
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
        telegram_id: 123456,
        role: "owner" // Mock role
      };
    }
    
    try {
      const response = await api.post('/api/auth/app', { initData, restaurant_id: restaurantId });
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

// ==========================================
// ADMIN API (Owner Dashboard)
// ==========================================

export const getRestaurant = async (restaurantId: number) => {
  const response = await api.get(`/api/restaurants/${restaurantId}`);
  return response.data;
};

export const updateRestaurantSettings = async (restaurantId: number, data: any) => {
  const response = await api.patch(`/api/restaurants/${restaurantId}`, data);
  return response.data;
};

export const updateOwnerProfile = async (data: any) => {
  const response = await api.patch('/api/auth/profile', data);
  return response.data;
};

export const getAdminCategories = async (restaurantId: number) => {
  const response = await api.get(`/api/menu/admin/${restaurantId}/categories`);
  return response.data;
};

export const createAdminCategory = async (restaurantId: number, data: any) => {
  const response = await api.post(`/api/menu/admin/${restaurantId}/categories`, data);
  return response.data;
};

export const deleteAdminCategory = async (catId: number) => {
  const response = await api.delete(`/api/menu/admin/categories/${catId}`);
  return response.data;
};

export const getAdminItems = async (restaurantId: number) => {
  const response = await api.get(`/api/menu/admin/${restaurantId}/items`);
  return response.data;
};

export const createAdminItem = async (restaurantId: number, data: any) => {
  const response = await api.post(`/api/menu/admin/${restaurantId}/items`, data);
  return response.data;
};

export const updateAdminItem = async (itemId: number, data: any) => {
  const response = await api.put(`/api/menu/admin/items/${itemId}`, data);
  return response.data;
};

export const deleteAdminItem = async (itemId: number) => {
  const response = await api.delete(`/api/menu/admin/items/${itemId}`);
  return response.data;
};

export const getAdminOrders = async (restaurantId: number, activeOnly: boolean = true) => {
  const response = await api.get(`/api/orders/admin/${restaurantId}`, {
    params: { active_only: activeOnly }
  });
  return response.data;
};

export const updateOrderStatus = async (orderId: number, status: string) => {
  const response = await api.patch(`/api/orders/${orderId}/status`, { status });
  return response.data;
};

