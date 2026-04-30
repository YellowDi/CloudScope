<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="h-8 gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs md:px-3"
      >
        <CircleUserRound class="h-3.5 w-3.5 shrink-0" />
        <span class="sr-only">打开用户菜单</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <div class="flex items-center justify-between px-2 py-1.5">
        <div class="space-y-0.5">
          <p class="text-sm font-medium text-foreground">暗黑模式</p>
          <p class="text-xs text-muted-foreground">切换深色界面</p>
        </div>
        <Switch :checked="themeStore.isDark" @update:checked="handleThemeChange" />
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select="handleLogout">
        退出登录
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { CircleUserRound } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const router = useRouter();

function handleThemeChange(value: boolean) {
  themeStore.setDarkMode(value);
}

function handleLogout() {
  authStore.logout();
  void router.push('/login');
}
</script>
