<template>
  <section class="flex flex-1 flex-col gap-6">
    <header class="flex flex-col">
      <div class="flex min-w-0 flex-col border-b border-border">
        <div class="flex min-w-0 justify-between gap-x-4 gap-y-3 pb-2 [flex-wrap:nowrap] items-center sm:items-end">
          <div class="min-w-0 flex flex-1 items-baseline gap-x-2 overflow-hidden">
            <h1 class="shrink-0 whitespace-nowrap leading-none font-semibold tracking-tight text-foreground text-[24px] sm:text-[28px] xl:text-[32px]">
              云账号管理
            </h1>
            <p class="hidden min-w-0 flex-1 truncate text-[18px] leading-none font-normal text-muted-foreground sm:inline sm:text-[20px]">
              展示后端已添加的腾讯云账号列表，并直接显示账号余额与基础信息。
            </p>
          </div>

          <div class="ml-auto flex min-w-0 shrink-0 justify-end gap-2">
            <Button
              variant="outline"
              class="h-8 gap-1 px-3 text-[14px]"
              :disabled="accountsStore.loading"
              @click="reloadAccounts"
            >
              <LoaderCircle v-if="accountsStore.loading" class="h-4 w-4 animate-spin" />
              重新拉取账号
            </Button>
            <Button
              variant="default"
              class="h-8 px-3 text-[14px]"
              @click="openCreateDialog"
            >
              添加云账号
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

    <Dialog :open="createDialogOpen" @update:open="handleDialogOpenChange">
      <DialogContent class="sm:max-w-xl" :show-close-button="!submitting">
        <DialogHeader class="pr-8">
          <DialogTitle>添加云账号</DialogTitle>
          <DialogDescription>
            填写账号名称、地域和腾讯云访问凭据，提交后将调用真实接口创建账号。
          </DialogDescription>
        </DialogHeader>

        <form class="grid gap-4" @submit.prevent="handleCreateAccount">
          <BaseInput
            v-model="form.name"
            label="账号名称"
            placeholder="如：生产主账号"
            autocomplete="organization"
          />
          <BaseInput
            v-model="form.region"
            label="地域"
            placeholder="如：ap-guangzhou"
            autocomplete="off"
          />
          <BaseInput
            v-model="form.secretId"
            label="SecretId"
            placeholder="请输入腾讯云 SecretId"
            autocomplete="off"
          />
          <BaseInput
            v-model="form.secretKey"
            label="SecretKey"
            type="password"
            placeholder="请输入腾讯云 SecretKey"
            autocomplete="off"
          />

          <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>

          <DialogFooter class="pt-2">
            <Button type="button" variant="outline" :disabled="submitting" @click="handleCancelCreate">
              取消
            </Button>
            <BaseButton
              label="确认添加"
              type="submit"
              :loading="submitting"
              loading-text="添加中"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAccountsStore } from '@/store/accounts';
import { useAppStore } from '@/store/app';
import { formatDateTime } from '@/utils/time';

const accountsStore = useAccountsStore();
const appStore = useAppStore();
const tableError = ref('');
const formError = ref('');
const submitting = ref(false);
const createDialogOpen = ref(false);
const form = reactive({
  name: '',
  region: 'ap-guangzhou',
  secretId: '',
  secretKey: '',
});
const rows = computed(() => accountsStore.accountList);

async function reloadAccounts() {
  tableError.value = '';
  try {
    await accountsStore.hydrateFromService();
  } catch (error) {
    tableError.value = error instanceof Error ? error.message : '拉取账号失败';
  }
}

function openCreateDialog() {
  formError.value = '';
  createDialogOpen.value = true;
}

function handleDialogOpenChange(open: boolean) {
  if (submitting.value) {
    return;
  }

  createDialogOpen.value = open;
  if (!open) {
    resetForm();
  }
}

function handleCancelCreate() {
  if (submitting.value) {
    return;
  }

  createDialogOpen.value = false;
  resetForm();
}

function resetForm() {
  formError.value = '';
  form.name = '';
  form.region = 'ap-guangzhou';
  form.secretId = '';
  form.secretKey = '';
}

async function handleCreateAccount() {
  formError.value = '';

  if (!form.name.trim() || !form.region.trim() || !form.secretId.trim() || !form.secretKey.trim()) {
    formError.value = '账号名称、地域、SecretId 和 SecretKey 不能为空';
    return;
  }

  submitting.value = true;
  try {
    await accountsStore.addAccount({
      name: form.name.trim(),
      region: form.region.trim(),
      secretId: form.secretId.trim(),
      secretKey: form.secretKey.trim(),
    });
    appStore.setNotice('云账号已添加', 'info');
    createDialogOpen.value = false;
    resetForm();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '添加云账号失败';
  } finally {
    submitting.value = false;
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
