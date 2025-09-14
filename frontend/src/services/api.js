import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }).then(res => res.data),
  
  register: (userData) => 
    api.post('/auth/register', userData).then(res => res.data),
  
  getCurrentUser: () => 
    api.get('/auth/me').then(res => res.data),
};

// Health Logs API
export const healthLogsAPI = {
  create: (logData) => 
    api.post('/health-logs', logData).then(res => res.data),
  
  getAll: (limit = 30, skip = 0) => 
    api.get(`/health-logs?limit=${limit}&skip=${skip}`).then(res => res.data),
  
  getById: (id) => 
    api.get(`/health-logs/${id}`).then(res => res.data),
  
  update: (id, logData) => 
    api.put(`/health-logs/${id}`, logData).then(res => res.data),
  
  delete: (id) => 
    api.delete(`/health-logs/${id}`).then(res => res.data),
};

// AI API
export const aiAPI = {
  analyze: (days = 7) => 
    api.post('/ai/analyze', { days }).then(res => res.data),
  
  getInsights: (limit = 10) => 
    api.get(`/ai/insights?limit=${limit}`).then(res => res.data),
};

// Analytics API
export const analyticsAPI = {
  getAnalytics: (days = 30) => 
    api.get(`/analytics?days=${days}`).then(res => res.data),
  
  getChartData: (metric, days = 30) => 
    api.get(`/analytics/chart/${metric}?days=${days}`).then(res => res.data),
  
  getCorrelations: (days = 30) => 
    api.get(`/analytics/correlations?days=${days}`).then(res => res.data),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => 
    api.get('/dashboard/summary').then(res => res.data),
};

export default api;
