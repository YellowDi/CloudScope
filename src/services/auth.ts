import { request } from './http';
import type { LoginResponse } from './types';

export async function login(username: string, password: string) {
  return request<LoginResponse, { username: string; password: string }>({
    path: '/api/auth/login',
    method: 'POST',
    body: {
      username,
      password,
    },
  });
}
