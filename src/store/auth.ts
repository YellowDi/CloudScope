import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { extractApiErrorText } from '@/lib/api-errors';
import { login as loginService } from '@/services/auth';
import { removeStorage, readStorage, writeStorage } from '@/utils/storage';

export const TOKEN_STORAGE_KEY = 'cloudscope_token';
export const AUTH_EXPIRED_EVENT = 'cloudscope:auth-expired';

const USER_STORAGE_KEY = 'cloudscope_user';
const TOKEN_EXPIRY_TIMER_MAX_MS = 2_147_483_647;

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readToken(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  const record = asRecord(value);
  if (!record) {
    return '';
  }

  return readToken(record.Token) || readToken(record.token) || readToken(record.data);
}

function readUser(value: unknown): AuthUser | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return (asRecord(record.user) ?? asRecord(asRecord(record.data)?.user)) as AuthUser | null;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return window.atob(padded);
}

function readTokenExpiresAt(value: string): number | null {
  const [, payload] = value.split('.');
  if (!payload) {
    return null;
  }

  try {
    const decodedPayload = JSON.parse(decodeBase64Url(payload)) as unknown;
    const exp = asRecord(decodedPayload)?.exp;
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(value: string): boolean {
  const expiresAt = readTokenExpiresAt(value);
  return expiresAt !== null && expiresAt <= Date.now();
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref('');
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  let expiryTimerId: number | undefined;

  const isAuthenticated = computed(() => Boolean(token.value) && !isTokenExpired(token.value));

  function clearExpiryTimer() {
    if (expiryTimerId !== undefined) {
      window.clearTimeout(expiryTimerId);
      expiryTimerId = undefined;
    }
  }

  function logout() {
    clearExpiryTimer();
    token.value = '';
    user.value = null;
    removeStorage(TOKEN_STORAGE_KEY);
    removeStorage(USER_STORAGE_KEY);
  }

  function expireSession() {
    logout();
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }

  function scheduleTokenExpiry(value: string) {
    clearExpiryTimer();

    const expiresAt = readTokenExpiresAt(value);
    if (expiresAt === null) {
      return;
    }

    const timeoutMs = expiresAt - Date.now();
    if (timeoutMs <= 0) {
      expireSession();
      return;
    }

    expiryTimerId = window.setTimeout(
      expireSession,
      Math.min(timeoutMs, TOKEN_EXPIRY_TIMER_MAX_MS),
    );
  }

  function hasValidSession() {
    if (!token.value) {
      return false;
    }

    if (isTokenExpired(token.value)) {
      expireSession();
      return false;
    }

    return true;
  }

  async function login(username: string, password: string) {
    loading.value = true;
    try {
      const response = await loginService(username, password);
      const loginToken = readToken(response);
      const loginUser = readUser(response);

      if (!loginToken) {
        throw new Error(extractApiErrorText(response) ?? '登录成功但未返回 Token');
      }

      token.value = loginToken;
      user.value = loginUser;
      window.localStorage.setItem(TOKEN_STORAGE_KEY, loginToken);
      scheduleTokenExpiry(loginToken);

      if (loginUser) {
        writeStorage(USER_STORAGE_KEY, loginUser);
      } else {
        removeStorage(USER_STORAGE_KEY);
      }
    } finally {
      loading.value = false;
    }
  }

  function restore() {
    const restoredToken = window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
    if (restoredToken && isTokenExpired(restoredToken)) {
      logout();
      return;
    }

    token.value = restoredToken;
    user.value = readStorage<AuthUser | null>(USER_STORAGE_KEY, null);
    scheduleTokenExpiry(restoredToken);
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    hasValidSession,
    login,
    logout,
    restore,
  };
});
