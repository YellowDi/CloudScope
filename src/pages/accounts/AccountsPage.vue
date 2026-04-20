<template>
  <section class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
    <header class="flex flex-col">
      <div class="flex min-w-0 flex-col border-b border-border">
        <div class="flex min-w-0 items-center justify-between gap-x-4 gap-y-3 pb-2 flex-nowrap sm:items-end">
          <div class="min-w-0 flex flex-1 items-baseline gap-x-2 overflow-hidden">
            <h1 class="shrink-0 whitespace-nowrap text-[24px] leading-none font-semibold tracking-tight text-foreground sm:text-[28px] xl:text-[32px]">
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
          class="cursor-pointer border-border shadow-sm transition-colors hover:border-primary/30"
          tabindex="0"
          role="button"
          @click="openEditDialog(account)"
          @keydown.enter.prevent="openEditDialog(account)"
          @keydown.space.prevent="openEditDialog(account)"
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

    <Dialog :open="dialogOpen" @update:open="handleDialogOpenChange">
      <DialogContent class="sm:max-w-xl" :show-close-button="!submitting && !deleting">
        <DialogHeader class="pr-8">
          <DialogTitle>{{ isEditMode ? '编辑云账号' : '添加云账号' }}</DialogTitle>
          <DialogDescription>
            {{ isEditMode ? '修改账号名称、地域和状态。删除操作需要二次确认。' : '填写账号名称、地域和腾讯云访问凭据，提交后将调用真实接口创建账号。' }}
          </DialogDescription>
        </DialogHeader>

        <form class="grid gap-4" @submit.prevent="handleSubmit">
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

          <template v-if="isEditMode">
            <BaseInput
              v-model="form.status"
              label="状态码"
              type="number"
              placeholder="请输入状态码"
              autocomplete="off"
            />
          </template>
          <template v-else>
            <BaseInput
              v-model="form.secretId"
              label="SecretId"
              placeholder="请输入腾讯云 SecretId"
              autocomplete="off"
            />
            <BaseInput
              v-model="form.secretKey"
              label="SecretKey"
              placeholder="请输入腾讯云 SecretKey"
              autocomplete="off"
            />
          </template>

          <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>

          <DialogFooter class="pt-2 sm:justify-between">
            <div class="flex min-h-9 items-center gap-2">
              <template v-if="isEditMode">
                <Button
                  v-if="!deleteConfirming"
                  type="button"
                  variant="destructive"
                  :disabled="submitting || deleting"
                  @click="deleteConfirming = true"
                >
                  删除
                </Button>
                <template v-else>
                  <span class="text-sm text-muted-foreground">确认删除该云账号？</span>
                  <Button
                    type="button"
                    variant="destructive"
                    :disabled="submitting || deleting"
                    @click="handleDeleteAccount"
                  >
                    <LoaderCircle v-if="deleting" class="mr-1 h-4 w-4 animate-spin" />
                    确认删除
                  </Button>
                </template>
              </template>
            </div>

            <div class="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" :disabled="submitting || deleting" @click="handleCancelDialog">
                取消
              </Button>
              <BaseButton
                :label="isEditMode ? '保存修改' : '确认添加'"
                type="submit"
                :loading="submitting"
                :loading-text="isEditMode ? '保存中' : '添加中'"
              />
            </div>
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
import type { CloudAccount } from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { useAppStore } from '@/store/app';
import { formatDateTimeWithMinutes } from '@/utils/time';

type DialogMode = 'create' | 'edit';

const accountsStore = useAccountsStore();
const appStore = useAppStore();
const tableError = ref('');
const formError = ref('');
const submitting = ref(false);
const deleting = ref(false);
const dialogOpen = ref(false);
const dialogMode = ref<DialogMode>('create');
const selectedAccount = ref<CloudAccount | null>(null);
const deleteConfirming = ref(false);
const form = reactive({
  name: '',
  region: 'ap-guangzhou',
  secretId: '',
  secretKey: '',
  status: '0',
});
const rows = computed(() => accountsStore.accountList);
const isEditMode = computed(() => dialogMode.value === 'edit');

async function reloadAccounts() {
  tableError.value = '';
  try {
    await accountsStore.hydrateFromService();
  } catch (error) {
    tableError.value = error instanceof Error ? error.message : '拉取账号失败';
  }
}

function openCreateDialog() {
  dialogMode.value = 'create';
  selectedAccount.value = null;
  dialogOpen.value = true;
  resetForm();
}

function openEditDialog(account: CloudAccount) {
  dialogMode.value = 'edit';
  selectedAccount.value = account;
  dialogOpen.value = true;
  formError.value = '';
  deleteConfirming.value = false;
  form.name = account.name;
  form.region = account.region;
  form.secretId = '';
  form.secretKey = '';
  form.status = typeof account.statusCode === 'number' ? String(account.statusCode) : '0';
}

function handleDialogOpenChange(open: boolean) {
  if (submitting.value || deleting.value) {
    return;
  }

  dialogOpen.value = open;
  if (!open) {
    resetDialogState();
  }
}

function handleCancelDialog() {
  if (submitting.value || deleting.value) {
    return;
  }

  dialogOpen.value = false;
  resetDialogState();
}

function resetForm() {
  formError.value = '';
  deleteConfirming.value = false;
  form.name = '';
  form.region = 'ap-guangzhou';
  form.secretId = '';
  form.secretKey = '';
  form.status = '0';
}

function resetDialogState() {
  selectedAccount.value = null;
  dialogMode.value = 'create';
  resetForm();
}

function parseStatus(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

async function handleSubmit() {
  formError.value = '';

  if (!form.name.trim() || !form.region.trim()) {
    formError.value = '账号名称和地域不能为空';
    return;
  }

  if (!isEditMode.value && (!form.secretId.trim() || !form.secretKey.trim())) {
    formError.value = 'SecretId 和 SecretKey 不能为空';
    return;
  }

  submitting.value = true;
  try {
    if (isEditMode.value) {
      const account = selectedAccount.value;
      const status = parseStatus(form.status);

      if (typeof account?.recordId !== 'number') {
        throw new Error('当前账号缺少可编辑的 Id');
      }
      if (status === null) {
        throw new Error('状态码必须为整数');
      }

      await accountsStore.editAccount({
        id: account.recordId,
        name: form.name.trim(),
        region: form.region.trim(),
        status,
      });
      appStore.setNotice('云账号已更新', 'info');
    } else {
      await accountsStore.addAccount({
        name: form.name.trim(),
        region: form.region.trim(),
        secretId: form.secretId.trim(),
        secretKey: form.secretKey.trim(),
      });
      appStore.setNotice('云账号已添加', 'info');
    }

    dialogOpen.value = false;
    resetDialogState();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : isEditMode.value ? '更新云账号失败' : '添加云账号失败';
  } finally {
    submitting.value = false;
  }
}

async function handleDeleteAccount() {
  formError.value = '';

  const account = selectedAccount.value;
  if (typeof account?.recordId !== 'number') {
    formError.value = '当前账号缺少可删除的 Id';
    return;
  }

  deleting.value = true;
  try {
    await accountsStore.removeAccount(account.recordId);
    appStore.setNotice('云账号已删除', 'info');
    dialogOpen.value = false;
    resetDialogState();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '删除云账号失败';
  } finally {
    deleting.value = false;
  }
}

function formatOptionalDateTime(value?: string) {
  if (!value) {
    return '--';
  }

  return formatDateTimeWithMinutes(value);
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
