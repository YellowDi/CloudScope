import { defineStore } from 'pinia';
import { ref } from 'vue';

const THEME_STORAGE_KEY = 'cloudscope_theme';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false);

  function applyTheme(value: boolean) {
    isDark.value = value;
    document.documentElement.classList.toggle('dark', value);
    document.documentElement.style.colorScheme = value ? 'dark' : 'light';
    window.localStorage.setItem(THEME_STORAGE_KEY, value ? 'dark' : 'light');
  }

  function setDarkMode(value: boolean) {
    applyTheme(value);
  }

  function toggleDarkMode() {
    applyTheme(!isDark.value);
  }

  function restore() {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(stored === 'dark');
  }

  return {
    isDark,
    setDarkMode,
    toggleDarkMode,
    restore,
  };
});
