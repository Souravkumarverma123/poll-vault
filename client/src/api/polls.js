import api from './axios';

export const createPoll = (data) => api.post('/polls', data);
export const getMyPolls = () => api.get('/polls');
export const getPoll = (id) => api.get(`/polls/${id}`);
export const deletePoll = (id) => api.delete(`/polls/${id}`);
export const publishPoll = (id) => api.patch(`/polls/${id}/publish`);
export const getPublicPoll = (shareId) => api.get(`/polls/public/${shareId}`);
export const submitResponse = (pollId, data) => api.post(`/polls/${pollId}/responses`, data);
export const getAnalytics = (id) => api.get(`/polls/${id}/analytics`);
