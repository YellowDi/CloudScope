<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div class="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-4 py-3">
        <div class="flex min-w-0 shrink-0 items-center gap-3">
          <img src="/logo.png" alt="CloudScope logo" class="h-9 w-9 shrink-0 rounded-md object-cover" />
          <div class="min-w-0">
            <p class="font-mono text-xs uppercase tracking-wide text-muted-foreground">CloudScope</p>
            <h1 class="truncate text-sm font-semibold tracking-tight text-foreground">腾讯云资源监控看板</h1>
          </div>
        </div>

        <nav class="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto whitespace-nowrap md:justify-center">
          <Button
            v-for="item in navItems"
            :key="item.to"
            as-child
            :variant="route.path === item.to ? 'secondary' : 'ghost'"
            size="sm"
            class="shrink-0"
          >
            <RouterLink :to="item.to">
              {{ item.label }}
            </RouterLink>
          </Button>
        </nav>

        <div class="shrink-0">
          <UserMenu />
        </div>
      </div>
    </header>

    <main class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/UserMenu.vue';
import { useAccountsStore } from '@/store/accounts';
import { useAppStore } from '@/store/app';

const accountsStore = useAccountsStore();
const appStore = useAppStore();
const route = useRoute();

const navItems = [
  { label: '总览', to: '/dashboard' },
  { label: '云账号', to: '/accounts' },
];

if (accountsStore.accountList.length === 0 && !accountsStore.loading) {
  void accountsStore.hydrateFromService().catch((error) => {
    appStore.setNotice(error instanceof Error ? error.message : '初始化账号失败', 'error');
  });
}
</script>
