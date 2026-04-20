import type { RequestOptions } from './types';
import { ApiError, extractApiErrorText } from '@/lib/api-errors';
import { TOKEN_STORAGE_KEY } from '@/store/auth';

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

function normalizeBaseUrl(value?: string) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

function buildRequestUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/api/') ? path.slice(4) : path;

  if (import.meta.env.DEV || !API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

function getErrorField(payload: unknown, key: string) {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function request<TResponse, TBody = unknown>(
  options: RequestOptions<TBody>,
): Promise<TResponse> {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(buildRequestUrl(options.path), {
      method: options.method ?? 'GET',
      headers: {
        ...headers,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      throw new ApiError(extractApiErrorText(payload) ?? `请求失败 (${response.status})`, {
        status: response.status,
        code: getErrorField(payload, 'code'),
        requestId: getErrorField(payload, 'requestId'),
      });
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('无法连接后端服务，请检查接口地址或网络配置。');
  }
}
