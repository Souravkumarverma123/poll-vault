import api from './axios';

export const createPoll = (data) => api.post('/polls', data);
export const getMyPolls = (params = {}) => api.get('/polls', { params });
export const getPoll = (id) => api.get(`/polls/${id}`);
export const editPoll = (id, data) => api.patch(`/polls/${id}`, data);
export const deletePoll = (id) => api.delete(`/polls/${id}`);
export const closePoll = (id) => api.patch(`/polls/${id}/close`);
export const publishPoll = (id) => api.patch(`/polls/${id}/publish`);
export const unpublishPoll = (id) => api.patch(`/polls/${id}/unpublish`);
export const getPublicPoll = (shareId) => api.get(`/polls/public/${shareId}`);
export const submitResponse = (pollId, data) => api.post(`/polls/${pollId}/responses`, data);
export const getAnalytics = (id) => api.get(`/polls/${id}/analytics`);
