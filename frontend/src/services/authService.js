import { api } from './api';

export const authService = {
  register: (data) =>
    api.post('/auth/register', data, false),

  login: (data) =>
    api.post('/auth/login', data, false),

  getProfile: () =>
    api.get('/auth/profile'),

  updateProfile: (data) =>
    api.put('/auth/profile', data),

  changePassword: (data) =>
    api.put('/auth/change-password', data),
};
