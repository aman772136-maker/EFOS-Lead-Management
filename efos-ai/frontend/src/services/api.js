import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      err.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const createLead = (data) => api.post('/leads', data);

export const getLeads = (params) => api.get('/leads', { params });

export const getLead = (id) => api.get(`/leads/${id}`);

export const updateLead = (id, data) => api.put(`/leads/${id}`, data);

export default api;
