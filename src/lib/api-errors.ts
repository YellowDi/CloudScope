import { toast } from 'vue-sonner';

type HandleApiErrorOptions = {
  title?: string;
  fallback?: string;
  description?: string;
  mode?: 'toast' | 'silent';
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  requestId?: string;

  constructor(message: string, meta: { status?: number; code?: string; requestId?: string } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = meta.status;
    this.code = meta.code;
    this.requestId = meta.requestId;
  }
}

export function getApiErrorMessage(error: unknown, fallback = '操作失败，请稍后重试。') {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    for (const key of ['message', 'msg', 'error', 'detail', 'title']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return fallback;
}

export function handleApiError(error: unknown, options: HandleApiErrorOptions = {}) {
  const message = getApiErrorMessage(error, options.fallback);

  if (options.mode !== 'silent') {
    toast.error(options.title ?? '操作失败', {
      description: options.description ?? message,
    });
  }

  return message;
}
