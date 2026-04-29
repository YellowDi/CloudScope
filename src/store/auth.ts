import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { extractApiErrorText } from '@/lib/api-errors';
import { login as loginService } from '@/services/auth';
import { removeStorage, readStorage, writeStorage } from '@/utils/storage';

export const TOKEN_STORAGE_KEY = 'cloudscope_token';

const USER_STORAGE_KEY = 'cloudscope_user';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref('');
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  const isAuthenticated = computed(() => Boolean(token.value));

  async function login(username: string, password: string) {
    loading.value = true;
    try {
      const response = await loginService(username, password);
      const loginToken = response.Token ?? response.token;

      if (!loginToken) {
        throw new Error(extractApiErrorText(response) ?? '登录成功但未返回 Token');
      }

      token.value = loginToken;
      user.value = response.user ?? null;
      window.localStorage.setItem(TOKEN_STORAGE_KEY, loginToken);

      if (response.user) {
        writeStorage(USER_STORAGE_KEY, response.user);
      } else {
        removeStorage(USER_STORAGE_KEY);
      }
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = '';
    user.value = null;
    removeStorage(TOKEN_STORAGE_KEY);
    removeStorage(USER_STORAGE_KEY);
  }

  function restore() {
    token.value = window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
    user.value = readStorage<AuthUser | null>(USER_STORAGE_KEY, null);
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    restore,
  };
});
