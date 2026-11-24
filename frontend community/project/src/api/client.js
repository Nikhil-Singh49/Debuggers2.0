import axios from 'axios';
import { mockAdapter } from './mock.js';

const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: apiUrl || '/api',
  timeout: 8000,
  ...(apiUrl ? {} : { adapter: mockAdapter }),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edupulseToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
