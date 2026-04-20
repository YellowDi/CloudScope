<template>
  <section class="flex flex-1 flex-col gap-6">
    <header class="flex flex-col">
      <div class="flex min-w-0 flex-col border-b border-border">
        <div class="flex min-w-0 justify-between gap-x-4 gap-y-3 pb-2 [flex-wrap:nowrap] items-center sm:items-end">
          <div class="min-w-0 flex flex-1 items-baseline gap-x-2 overflow-hidden">
            <h1 class="shrink-0 whitespace-nowrap leading-none font-semibold tracking-tight text-foreground text-[32px] sm:text-[40px] xl:text-[48px]">
              云账号管理
            </h1>
            <p class="hidden min-w-0 flex-1 truncate text-[18px] leading-none font-normal text-muted-foreground sm:inline sm:text-[20px]">
              展示后端已添加的腾讯云账号列表，并直接显示账号余额与基础信息。
            </p>
          </div>

          <div class="ml-auto flex min-w-0 shrink-0 justify-end">
            <Button
              variant="outline"
              class="h-8 gap-1 px-3 text-[14px]"
              :disabled="accountsStore.loading"
              @click="reloadAccounts"
            >
              <LoaderCircle v-if="accountsStore.loading" class="h-4 w-4 animate-spin" />
              重新拉取账号
            </Button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col gap-3">
      <Alert v-if="tableError" variant="destructive">
        <AlertTitle>操作失败</AlertTitle>
        <AlertDescription>{{ tableError }}</AlertDescription>
      </Alert>

      <SkeletonLoader v-if="accountsStore.loading" kind="card" :rows="4" />

      <EmptyState
        v-else-if="rows.length === 0"
        title="暂无云账号"
        description="后端当前没有返回已添加的腾讯云账号。"
      />

      <div v-else class="grid gap-4 xl:grid-cols-2">
        <Card
          v-for="account in rows"
          :key="account.id"
          class="border-border shadow-sm"
        >
          <CardHeader class="gap-3 p-4 pb-0">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <CardTitle class="truncate text-lg">{{ account.name }}</CardTitle>
                <CardDescription class="mt-1">{{ account.uuid || account.id }}</CardDescription>
              </div>
              <div class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {{ formatStatus(account.statusCode, account.status) }}
              </div>
            </div>
          </CardHeader>

          <CardContent class="grid gap-4 p-4">
            <div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">地域</p>
                <p class="font-medium text-foreground">{{ account.region }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">账户 UIN</p>
                <p class="font-medium text-foreground">{{ account.uin ?? '--' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">创建时间</p>
                <p class="font-medium text-foreground">{{ formatOptionalDateTime(account.createdAt) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">更新时间</p>
                <p class="font-medium text-foreground">{{ formatOptionalDateTime(account.updatedAt || account.lastSyncedAt) }}</p>
              </div>
            </div>

            <div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">可用余额</p>
                <p class="font-medium text-foreground">{{ formatCurrency(account.balance) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">现金余额</p>
                <p class="font-medium text-foreground">{{ formatCurrency(account.cashAccountBalance) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">赠送金余额</p>
                <p class="font-medium text-foreground">{{ formatCurrency(account.presentAccountBalance) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">冻结余额</p>
                <p class="font-medium text-foreground">{{ formatCurrency(account.freezeAmount) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">欠费余额</p>
                <p class="font-medium text-foreground">{{ formatCurrency(account.oweAmount) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide">账号编号</p>
                <p class="font-medium text-foreground">{{ account.recordId ?? '--' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccountsStore } from '@/store/accounts';
import { formatDateTime } from '@/utils/time';

const accountsStore = useAccountsStore();
const tableError = ref('');
const rows = computed(() => accountsStore.accountList);

async function reloadAccounts() {
  tableError.value = '';
  try {
    await accountsStore.hydrateFromService();
  } catch (error) {
    tableError.value = error instanceof Error ? error.message : '拉取账号失败';
  }
}

function formatOptionalDateTime(value?: string) {
  if (!value) {
    return '--';
  }

  return formatDateTime(value);
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatStatus(statusCode?: number, fallback?: string) {
  if (typeof statusCode === 'number') {
    return `状态码 ${statusCode}`;
  }

  return fallback || '--';
}
</script>
