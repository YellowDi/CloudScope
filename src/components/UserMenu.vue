<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" class="whitespace-nowrap px-2 md:px-4">
        <CircleUserRound class="h-4 w-4 shrink-0" />
        <span class="sr-only">打开用户菜单</span>
        <span class="hidden items-center gap-2 whitespace-nowrap md:inline-flex">
          <span class="text-sm font-medium">{{ user?.name ?? '访客' }}</span>
          <span class="text-xs text-muted-foreground">/</span>
          <span class="text-xs text-muted-foreground">{{ user?.role ?? '未登录' }}</span>
        </span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel>{{ user?.name ?? '访客' }}</DropdownMenuLabel>
      <DropdownMenuLabel class="pt-0 text-xs font-normal text-muted-foreground">
        {{ user?.role ?? '未登录' }}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const router = useRouter();
const user = authStore.user;

function handleThemeChange(value: boolean) {
  themeStore.setDarkMode(value);
}

function handleLogout() {
  authStore.logout();
  void router.push('/login');
}
</script>
