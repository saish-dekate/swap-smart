import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/auth/register/', data),
  login: (data) => api.post('/auth/auth/login/', data),
  me: () => api.get('/auth/users/me/'),
  updateProfile: (data) => {
    if (data instanceof FormData) {
      return api.patch('/auth/users/update_profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.patch('/auth/users/update_profile/', data);
  },
  notifications: () => api.get('/auth/users/notifications/'),
};

export const productsAPI = {
  list: (params) => api.get('/products/', { params }),
  get: (id) => api.get(`/products/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images' && data.images && data.images.length > 0) {
        data.images.forEach(img => formData.append('images', img));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => api.patch(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  categories: () => api.get('/products/categories/'),
  myProducts: () => api.get('/products/my_products/'),
  matches: (id) => api.get(`/matching/products/${id}/matches/`),
};

export const swapsAPI = {
  list: () => api.get('/swaps/'),
  create: (data) => api.post('/swaps/', data),
  accept: (id) => api.post(`/swaps/${id}/accept/`),
  reject: (id) => api.post(`/swaps/${id}/reject/`),
  cancel: (id) => api.post(`/swaps/${id}/cancel/`),
  complete: (id) => api.post(`/swaps/${id}/complete/`),
  counter: (id, data) => api.post(`/swaps/${id}/counter/`, data),
};

export const reviewsAPI = {
  list: (userId) => api.get(`/reviews/user/${userId}/`),
  create: (data) => api.post('/reviews/', data),
};

export const bidsAPI = {
  list: () => api.get('/bids/'),
  create: (data) => api.post('/bids/', data),
  accept: (id) => api.post(`/bids/${id}/accept/`),
  reject: (id) => api.post(`/bids/${id}/reject/`),
  withdraw: (id) => api.post(`/bids/${id}/withdraw/`),
};

export const matchingAPI = {
  suggested: () => api.get('/matching/products/suggested/'),
  compatibility: (product1, product2) => api.get('/matching/compatibility/', { params: { product1, product2 } }),
};

export const messagingAPI = {
  listConversations: () => api.get('/messages/'),
  getMessages: (conversationId) => api.get(`/messages/${conversationId}/messages/`),
  sendMessage: (conversationId, data) => api.post(`/messages/${conversationId}/send/`, data),
  getUnreadCount: () => api.get('/messages/unread-count/'),
  starConversation: (conversationId) => api.post(`/messages/${conversationId}/star/`),
  deleteConversation: (conversationId) => api.post(`/messages/${conversationId}/delete/`),
};

export default api;
