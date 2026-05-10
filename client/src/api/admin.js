import api from './axios';

export const getSystemStats = () => api.get('/admin/stats');
