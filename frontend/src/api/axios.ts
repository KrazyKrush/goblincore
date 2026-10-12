import axios, { InternalAxiosRequestConfig } from 'axios'; // <-- Добавили импорт типа

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Явно указываем тип для config
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;