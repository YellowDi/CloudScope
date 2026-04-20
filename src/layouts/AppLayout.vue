<template>
  <div class="min-h-screen bg-background" :style="layoutStyle">
    <header
      ref="headerRef"
      class="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div class="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-4 py-3">
        <div class="flex min-w-0 shrink-0 items-center gap-3">
          <img src="/logo.png" alt="CloudScope logo" class="h-9 w-9 shrink-0 rounded-md object-cover" />
          <div class="min-w-0">
            <p class="font-mono text-xs uppercase tracking-wide text-muted-foreground">CloudScope</p>
            <h1 class="truncate text-sm font-semibold tracking-tight text-foreground">腾讯云资源监控看板</h1>
          </div>
        </div>

        <div class="min-w-0 flex-1 overflow-visible">
          <nav
            aria-label="主导航"
            data-app-header-nav
            class="-my-1 flex min-w-0 overflow-x-auto px-1 py-1 whitespace-nowrap"
          >
            <div class="flex min-w-max flex-1 items-center justify-end gap-2 md:justify-center">
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
            </div>
          </nav>
        </div>

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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/UserMenu.vue';
import { useAccountsStore } from '@/store/accounts';
import { useAppStore } from '@/store/app';

const accountsStore = useAccountsStore();
const appStore = useAppStore();
const route = useRoute();
const headerRef = ref<HTMLElement | null>(null);
const headerHeight = ref(0);

const layoutStyle = computed(() => ({
  '--table-page-sticky-top': `${headerHeight.value}px`,
}));

const navItems = [
  { label: '总览', to: '/dashboard' },
  { label: '云账号', to: '/accounts' },
];

let resizeObserver: ResizeObserver | null = null;

function syncHeaderHeight() {
  headerHeight.value = headerRef.value?.getBoundingClientRect().height ?? 0;
}

onMounted(() => {
  syncHeaderHeight();

  if (typeof ResizeObserver !== 'undefined' && headerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      syncHeaderHeight();
    });
    resizeObserver.observe(headerRef.value);
  }

  window.addEventListener('resize', syncHeaderHeight);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener('resize', syncHeaderHeight);
});

if (accountsStore.accountList.length === 0 && !accountsStore.loading) {
  void accountsStore.hydrateFromService().catch((error) => {
    appStore.setNotice(error instanceof Error ? error.message : '初始化账号失败', 'error');
  });
}
</script>
