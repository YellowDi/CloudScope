<template>
  <div class="flex items-center gap-2">
    <TooltipWrap :content="themeStore.isDark ? '切换浅色模式' : '切换暗黑模式'">
      <Button
        variant="ghost"
        size="icon-sm"
        class="h-8 w-8"
        :aria-label="themeStore.isDark ? '切换浅色模式' : '切换暗黑模式'"
        @click="handleThemeToggle"
      >
        <Sun v-if="themeStore.isDark" class="h-3.5 w-3.5" />
        <Moon v-else class="h-3.5 w-3.5" />
      </Button>
    </TooltipWrap>

    <Button
      variant="ghost"
      size="sm"
      class="h-8 gap-1.5 px-2.5 text-xs"
      @click="handleLogout"
    >
      <LogOut class="h-3.5 w-3.5 shrink-0" />
      <span>登出</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { LogOut, Moon, Sun } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { TooltipWrap } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const router = useRouter();

function handleThemeToggle() {
  themeStore.toggleDarkMode();
}

function handleLogout() {
  authStore.logout();
  void router.push('/login');
}
</script>
