<template>
  <section class="flex flex-1 flex-col gap-6">
    <PageHeader eyebrow="Accounts" title="云账号管理" description="支持账号新增、切换、连接测试、资源同步与删除，全部通过 mock API 模拟。">
      <template #actions>
        <BaseButton label="重新拉取账号" variant="secondary" :loading="accountsStore.loading" @click="reloadAccounts" />
      </template>
    </PageHeader>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <Card class="border-border shadow-sm">
        <CardHeader class="p-4 pb-0">
          <CardTitle>添加账号</CardTitle>
          <CardDescription>仅保存账号名称与地域，SecretKey 不进入前端存储。</CardDescription>
        </CardHeader>
        <CardContent class="p-4">
          <form class="grid gap-4" @submit.prevent="handleAddAccount">
            <BaseInput v-model="name" label="账号名称" placeholder="如：生产主账号" />
            <BaseInput v-model="region" label="地域" placeholder="如：ap-guangzhou" />
            <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>
            <BaseButton label="添加账号" type="submit" :loading="submitting" />
          </form>
        </CardContent>
      </Card>

      <div class="flex min-h-0 flex-1 flex-col gap-3">
        <Alert v-if="tableError" variant="destructive">
          <AlertTitle>操作失败</AlertTitle>
          <AlertDescription>{{ tableError }}</AlertDescription>
        </Alert>

        <SkeletonLoader v-if="accountsStore.loading" kind="card" :rows="4" />

        <EmptyState
          v-else-if="rows.length === 0"
          title="暂无云账号"
          description="添加第一个腾讯云账号后，即可切换账号并查看资源数据。"
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
                  <CardDescription class="mt-1">{{ account.id }}</CardDescription>
                </div>
                <StatusTag :status="String(account.status === 'connected' ? 'connected' : 'error')" />
              </div>
            </CardHeader>

            <CardContent class="grid gap-4 p-4">
              <div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide">地域</p>
                  <p class="font-medium text-foreground">{{ account.region }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide">最近同步时间</p>
                  <p class="font-medium text-foreground">{{ formatDateTime(String(account.lastSyncedAt)) }}</p>
                </div>
              </div>

              <div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide">账户 UIN</p>
                  <p class="font-medium text-foreground">{{ balanceMap[account.id]?.uin ?? '--' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide">可用余额</p>
                  <p class="font-medium text-foreground">{{ balanceMap[account.id]?.availableBalance ?? '--' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide">现金余额</p>
                  <p class="font-medium text-foreground">{{ balanceMap[account.id]?.cashBalance ?? '--' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide">可用信用额度</p>
                  <p class="font-medium text-foreground">{{ balanceMap[account.id]?.creditBalance ?? '--' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide">欠费金额</p>
                  <p class="font-medium text-foreground">{{ balanceMap[account.id]?.oweAmount ?? '--' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide">临时额度</p>
                  <p class="font-medium text-foreground">{{ balanceMap[account.id]?.tempCredit ?? '--' }}</p>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  :disabled="isBusy(account.id)"
                  @click="handleTest(account.id)"
                >
                  <LoaderCircle v-if="busyAccountId === account.id && busyAction === 'test'" class="mr-1 h-4 w-4 animate-spin" />
                  测试连接
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  :disabled="isBusy(account.id)"
                  @click="handleSync(account.id)"
                >
                  <LoaderCircle v-if="busyAccountId === account.id && busyAction === 'sync'" class="mr-1 h-4 w-4 animate-spin" />
                  同步数据
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  class="w-full"
                  :disabled="isBusy(account.id)"
                  @click="handleDelete(account.id)"
                >
                  <LoaderCircle v-if="busyAccountId === account.id && busyAction === 'delete'" class="mr-1 h-4 w-4 animate-spin" />
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageHeader from '@/components/PageHeader.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import StatusTag from '@/components/StatusTag.vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAccountBalance } from '@/services/billing';
import type { AccountBalanceSummary } from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { useAppStore } from '@/store/app';
import { formatDateTime } from '@/utils/time';

const accountsStore = useAccountsStore();
const appStore = useAppStore();
const name = ref('');
const region = ref('ap-guangzhou');
const submitting = ref(false);
const formError = ref('');
const tableError = ref('');
const busyAccountId = ref('');
const busyAction = ref<'test' | 'sync' | 'delete' | ''>('');
const balanceMap = ref<Record<string, AccountBalanceSummary>>({});

const rows = computed(() => accountsStore.accountList);

function isBusy(accountId: string) {
  return busyAccountId.value === accountId;
}

async function handleAddAccount() {
  formError.value = '';
  if (!name.value.trim() || !region.value.trim()) {
    formError.value = '账号名称和地域不能为空';
    return;
  }

  submitting.value = true;
  try {
    await accountsStore.addAccount({
      name: name.value.trim(),
      region: region.value.trim(),
    });
    await loadBalances();
    name.value = '';
    region.value = 'ap-guangzhou';
    appStore.setNotice('云账号已添加', 'info');
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '添加账号失败';
  } finally {
    submitting.value = false;
  }
}

async function reloadAccounts() {
  tableError.value = '';
  try {
    await accountsStore.hydrateFromService();
    await loadBalances();
  } catch (error) {
    tableError.value = error instanceof Error ? error.message : '拉取账号失败';
  }
}

async function handleTest(accountId: string) {
  await runRowAction(accountId, 'test', async () => {
    const account = await accountsStore.testConnection(accountId);
    appStore.setNotice(
      account.status === 'connected' ? `账号 ${account.name} 连接成功` : `账号 ${account.name} 连接失败`,
      account.status === 'connected' ? 'info' : 'error',
    );
  });
}

async function handleSync(accountId: string) {
  await runRowAction(accountId, 'sync', async () => {
    const account = await accountsStore.syncAccount(accountId);
    await loadBalances([accountId]);
    appStore.setNotice(`账号 ${account.name} 已完成资源同步`, 'info');
  });
}

async function handleDelete(accountId: string) {
  await runRowAction(accountId, 'delete', async () => {
    await accountsStore.removeAccount(accountId);
    const nextBalanceMap = { ...balanceMap.value };
    delete nextBalanceMap[accountId];
    balanceMap.value = nextBalanceMap;
    appStore.setNotice('云账号已删除', 'info');
  });
}

async function loadBalances(accountIds?: string[]) {
  const targets = accountIds ?? rows.value.map((account) => account.id);
  if (targets.length === 0) {
    balanceMap.value = {};
    return;
  }

  const results = await Promise.all(
    targets.map(async (accountId) => {
      try {
        const balance = await getAccountBalance(accountId);
        return [accountId, balance] as const;
      } catch {
        return [accountId, null] as const;
      }
    }),
  );

  const nextBalanceMap = accountIds ? { ...balanceMap.value } : {};
  results.forEach(([accountId, balance]) => {
    if (balance) {
      nextBalanceMap[accountId] = balance;
    }
  });
  balanceMap.value = nextBalanceMap;
}

async function runRowAction(
  accountId: string,
  action: 'test' | 'sync' | 'delete',
  executor: () => Promise<void>,
) {
  tableError.value = '';
  busyAccountId.value = accountId;
  busyAction.value = action;
  try {
    await executor();
  } catch (error) {
    tableError.value = error instanceof Error ? error.message : '操作失败';
  } finally {
    busyAccountId.value = '';
    busyAction.value = '';
  }
}

watch(
  () => rows.value.map((account) => account.id).join(','),
  () => {
    void loadBalances();
  },
  { immediate: true },
);
</script>
