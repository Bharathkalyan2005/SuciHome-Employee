import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    if (config.url?.includes('/admin')) {
      const adminToken = localStorage.getItem('sucihome_admin_token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else if (config.url?.includes('/employee')) {
      const employeeToken = localStorage.getItem('sucihome_employee_token');
      if (employeeToken) {
        config.headers.Authorization = `Bearer ${employeeToken}`;
      }
    } else {
      const token = localStorage.getItem('sparkclean_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
