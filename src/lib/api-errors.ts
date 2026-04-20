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

const ERROR_MESSAGE_KEYS = ['message', 'msg', 'error', 'detail', 'title', 'reason', 'description'] as const;
const MAX_ERROR_MESSAGE_DEPTH = 4;

function normalizeErrorText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function extractNestedErrorText(
  value: unknown,
  depth = 0,
  visited = new WeakSet<object>(),
): string | undefined {
  const text = normalizeErrorText(value);
  if (text) {
    return text;
  }

  if (depth >= MAX_ERROR_MESSAGE_DEPTH || value === null || typeof value !== 'object') {
    return undefined;
  }

  if (visited.has(value)) {
    return undefined;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedText = extractNestedErrorText(item, depth + 1, visited);
      if (nestedText) {
        return nestedText;
      }
    }
    return undefined;
  }

  const record = value as Record<string, unknown>;

  for (const key of ERROR_MESSAGE_KEYS) {
    const nestedText = extractNestedErrorText(record[key], depth + 1, visited);
    if (nestedText) {
      return nestedText;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nestedText = extractNestedErrorText(nestedValue, depth + 1, visited);
    if (nestedText) {
      return nestedText;
    }
  }

  return undefined;
}

export function extractApiErrorText(error: unknown) {
  return extractNestedErrorText(error);
}

export function getApiErrorMessage(error: unknown, fallback = '操作失败，请稍后重试。') {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }

  return extractApiErrorText(error) ?? fallback;
}

function normalizeToastText(value?: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function handleApiError(error: unknown, options: HandleApiErrorOptions = {}) {
  const fallback = normalizeToastText(options.fallback) ?? '操作失败，请稍后重试。';
  const explicitTitle = normalizeToastText(options.title);
  const explicitDescription = normalizeToastText(options.description);
  const message = getApiErrorMessage(error, fallback);
  const usesFallbackMessage = message === fallback;
  const title = !usesFallbackMessage && message !== explicitTitle
    ? message
    : explicitTitle ?? message;
  const description = explicitDescription
    ?? (!usesFallbackMessage && explicitTitle && explicitTitle !== title
      ? explicitTitle
      : usesFallbackMessage && explicitTitle && fallback !== title
        ? fallback
        : undefined);

  if (options.mode !== 'silent') {
    toast.error(title, description ? { description } : undefined);
  }

  return message;
}
