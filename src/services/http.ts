import type { RequestOptions } from './types';
import { handleMockRequest } from '@/mock/router';
import { TOKEN_STORAGE_KEY } from '@/store/auth';

export async function request<TResponse, TBody = unknown>(
  options: RequestOptions<TBody>,
): Promise<TResponse> {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  return handleMockRequest<TResponse>({
    ...options,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
