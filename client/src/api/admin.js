import api from './axios';

export const getSystemStats = () => api.get('/admin/stats');

export const getAllPolls = (params) => api.get('/admin/polls', { params });
export const adminClosePoll = (id) => api.patch(`/admin/polls/${id}/close`);
export const adminDeletePoll = (id) => api.delete(`/admin/polls/${id}`);

export const getAllUsers = (params) => api.get('/admin/users', { params });
export const updateUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role });
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`);

export const getSystemSettings = () => api.get('/admin/settings');
export const updateSystemSettings = (data) => api.patch('/admin/settings', data);
