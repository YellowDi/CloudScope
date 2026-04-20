import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
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
      token.value = response.token;
      user.value = response.user;
      window.localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      writeStorage(USER_STORAGE_KEY, response.user);
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
