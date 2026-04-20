import type { LoginResponse } from '@/services/types';
import { randomDelay, sleep } from './seed';

export async function mockLogin(username: string, password: string): Promise<LoginResponse> {
  await sleep(randomDelay());

  if (!username.trim() || !password.trim()) {
    throw new Error('用户名和密码不能为空');
  }

  return {
    token: 'mock-token',
    user: {
      id: 'user-admin',
      name: username,
      role: '平台管理员',
    },
  };
}
