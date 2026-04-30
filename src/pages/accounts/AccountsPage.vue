<template>
  <section class="-mt-8 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
    <header
      class="sticky z-10 flex flex-col gap-4 bg-background/95 py-2 backdrop-blur supports-backdrop-filter:bg-background/80"
      :style="{ top: 'var(--table-page-sticky-top)' }"
    >
      <div class="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-2">
        <h1 class="leading-none font-semibold tracking-tight text-foreground text-[24px] sm:text-[28px] xl:text-[32px]">
          云账号管理
        </h1>
        <p class="max-w-3xl text-[18px] leading-none font-normal text-muted-foreground sm:text-[20px]">
          统一管理云资源相关的账号与配套事务。
        </p>
      </div>

      <div class="flex min-w-0 items-end gap-2 border-b border-border">
        <div class="relative min-w-0 flex-1 overflow-visible pt-1">
          <div
            ref="accountCategoryTabsScrollViewportRef"
            data-page-header-tabs-scroll
            class="min-w-0 -mt-1 overflow-x-auto whitespace-nowrap pt-1"
            @scroll="handleAccountCategoryTabsScroll"
          >
            <nav class="relative flex min-w-max flex-nowrap items-center text-[14px]">
              <button
                v-for="tab in accountCategoryTabs"
                :key="tab.value"
                :ref="(element) => setAccountCategoryTabRef(tab.value, element)"
                type="button"
                :aria-pressed="activeCategoryTab === tab.value"
                :class="[
                  'group relative shrink-0 px-3 pb-[11px] text-muted-foreground transition-colors hover:text-foreground',
                  'duration-180 ease-out',
                  activeCategoryTab === tab.value ? 'font-semibold text-foreground' : '',
                ]"
                @click="activeCategoryTab = tab.value"
              >
                <span class="relative isolate inline-block">
                  <span class="pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-md transition-colors group-hover:[background:var(--interactive-hover,rgba(0,0,0,0.045))]" />
                  <span class="relative z-10">{{ tab.label }}</span>
                </span>
              </button>
              <span
                aria-hidden="true"
                class="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-foreground transition-[transform,width,opacity] duration-300 ease-out"
                :style="accountCategoryIndicatorStyle"
              />
            </nav>
          </div>

          <div
            v-if="accountCategoryTabsOverflowLeft"
            class="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-background via-background/88 to-transparent"
          />
          <div
            v-if="accountCategoryTabsOverflowRight"
            class="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-background via-background/92 to-transparent"
          />
        </div>

        <div class="ml-auto flex shrink-0 items-center justify-end pb-2 gap-1 sm:gap-2">
          <div class="ml-auto flex min-w-0 shrink-0 justify-end gap-1 sm:gap-2">
            <Button
              variant="outline"
              class="h-8 gap-1 px-3 text-[14px]"
              :disabled="accountsStore.loading"
              @click="reloadAccounts"
            >
              <LoaderCircle v-if="accountsStore.loading" class="h-4 w-4 animate-spin" />
              刷新数据
            </Button>
            <Button
              v-if="activeCategoryTab === 'tencent'"
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

    <template v-if="activeCategoryTab === 'tencent'">
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

        <div v-else class="grid gap-4 md:grid-cols-3 md:items-start">
          <div
            v-for="(column, columnIndex) in accountColumns"
            :key="columnIndex"
            class="grid gap-4"
          >
            <Card
              v-for="account in column"
              :key="account.id"
              class="min-w-0 overflow-hidden rounded-[20px] border border-stone-200 bg-stone-50 shadow-none transition-none dark:border-zinc-800 dark:bg-zinc-900"
            >
            <div class="rounded-[16px] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_5px_10px_rgba(17,24,39,0.05)] dark:bg-zinc-950 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_18px_-14px_rgba(0,0,0,0.55)]">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <CardTitle class="truncate text-[18px] tracking-tight">{{ account.name }}</CardTitle>
                </div>
                <StatusBadge
                  v-bind="getAccountStatusBadge(account.statusCode, account.status)"
                  class="shrink-0"
                />
              </div>

              <div class="mt-4 rounded-[16px] bg-stone-100 px-4 py-3.5 dark:bg-zinc-900">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-xs text-muted-foreground">可用余额</p>
                    <p
                      class="mt-1 truncate text-[28px] font-semibold tracking-[-0.03em] tabular-nums"
                      :class="isLowAvailableBalance(account.balance) ? 'text-destructive' : 'text-foreground'"
                    >
                      {{ formatCurrency(account.balance) }}
                    </p>
                  </div>
                  <div
                    v-if="isLowAvailableBalance(account.balance)"
                    class="shrink-0 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive"
                  >
                    低余额
                  </div>
                </div>
              </div>

              <Transition
                @before-enter="handleExpandBeforeEnter"
                @enter="handleExpandEnter"
                @after-enter="handleExpandAfterEnter"
                @before-leave="handleExpandBeforeLeave"
                @leave="handleExpandLeave"
                @after-leave="handleExpandAfterLeave"
              >
                <div
                  v-if="isAccountExpanded(account.id)"
                  :id="`account-details-${account.id}`"
                  class="mt-4 border-t border-border/60 pt-4"
                >
                  <div class="space-y-4">
                    <section class="space-y-2">
                      <p class="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">账号信息</p>
                      <div class="grid grid-cols-2 gap-2">
                        <div
                          v-for="field in getAccountMetaFields(account)"
                          :key="field.label"
                          class="rounded-xl bg-stone-100 px-3 py-2.5 dark:bg-zinc-900"
                        >
                          <p class="text-[11px] text-muted-foreground">{{ field.label }}</p>
                          <p class="mt-1 truncate text-sm font-medium text-foreground" :class="field.numeric ? 'tabular-nums' : undefined">
                            {{ field.value }}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section class="space-y-2">
                      <p class="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">余额明细</p>
                      <div class="grid grid-cols-2 gap-2">
                        <div
                          v-for="field in getAccountBalanceFields(account)"
                          :key="field.label"
                          class="rounded-xl bg-stone-100 px-3 py-2.5 dark:bg-zinc-900"
                        >
                          <p class="text-[11px] text-muted-foreground">{{ field.label }}</p>
                          <p
                            class="mt-1 truncate text-sm font-medium tabular-nums"
                            :class="field.danger ? 'text-destructive' : 'text-foreground'"
                          >
                            {{ field.value }}
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="flex items-center justify-between gap-3 px-4 py-2.5">
              <button
                type="button"
                class="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-180 hover:text-foreground"
                :aria-expanded="isAccountExpanded(account.id)"
                :aria-controls="`account-details-${account.id}`"
                @click="toggleAccountDetails(account.id)"
              >
                {{ isAccountExpanded(account.id) ? '收起详情' : '展开详情' }}
                <ChevronDown
                  class="h-4 w-4 transition-transform duration-180"
                  :class="isAccountExpanded(account.id) ? 'rotate-180' : undefined"
                />
              </button>

              <div class="flex shrink-0 items-center gap-1.5">
                <TooltipWrap content="编辑账号">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    class="size-7 rounded-md"
                    aria-label="编辑账号"
                    @click="openEditDialog(account)"
                  >
                    <PencilLine class="h-3.5 w-3.5" />
                  </Button>
                </TooltipWrap>

                <TooltipWrap content="管理子账号">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    class="size-7 rounded-md"
                    aria-label="管理子账号"
                    @click="openSubAccountManagerDialog(account)"
                  >
                    <Users class="h-3.5 w-3.5" />
                  </Button>
                </TooltipWrap>

                <Button
                  type="button"
                  variant="outline"
                  class="h-7 w-auto shrink-0 justify-start gap-1 rounded-md px-0 text-[11px] has-[>svg]:pl-1 has-[>svg]:pr-1.75"
                  :disabled="quickLoginLoadingAccountId === account.id || Boolean(quickLoginSubmittingId)"
                  @click="handleQuickLogin(account)"
                >
                  <LoaderCircle
                    v-if="quickLoginLoadingAccountId === account.id"
                    class="h-3.5 w-3.5 animate-spin"
                  />
                  <LogIn v-else class="h-3.5 w-3.5" />
                  快捷登录
                </Button>
              </div>
            </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog :open="dialogOpen" @update:open="handleDialogOpenChange">
        <DialogContent class="sm:max-w-xl" :show-close-button="!dialogBusy">
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
              placeholder="如：ap-shanghai"
              autocomplete="off"
            />

            <template v-if="isEditMode">
              <BaseSelect
                v-model="form.status"
                label="账号状态"
                :options="ACCOUNT_STATUS_OPTIONS"
                placeholder="请选择账号状态"
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
                    :disabled="dialogBusy"
                    @click="deleteConfirming = true"
                  >
                    删除
                  </Button>
                  <template v-else>
                    <span class="text-sm text-muted-foreground">确认删除该云账号？</span>
                    <Button
                      type="button"
                      variant="destructive"
                      :disabled="dialogBusy"
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

      <Dialog :open="subAccountManagerDialogOpen" @update:open="handleSubAccountManagerDialogOpenChange">
        <DialogContent class="sm:max-w-xl" :show-close-button="!subAccountManagerBusy">
          <DialogHeader class="pr-8">
            <DialogTitle>子账号管理</DialogTitle>
            <DialogDescription>
              {{ subAccountOwnerAccount?.name }} 的子账号将用于快捷登录维护。
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4">
            <Alert v-if="subAccountError" variant="destructive">
              <AlertTitle>子账号操作失败</AlertTitle>
              <AlertDescription>{{ subAccountError }}</AlertDescription>
            </Alert>

            <section class="grid gap-3">
              <div class="max-h-72 overflow-y-auto pr-1">
                <div
                  v-if="subAccountsLoading"
                  class="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground"
                >
                  子账号加载中...
                </div>
                <div
                  v-else-if="managedAccountSubAccounts.length === 0"
                  class="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground"
                >
                  当前云账号下暂无子账号，点击右上角新增子账号即可维护快捷登录信息。
                </div>
                <template v-else>
                  <div class="divide-y divide-dashed divide-border">
                    <div
                      v-for="subAccount in managedAccountSubAccounts"
                      :key="subAccount.id"
                      class="flex min-h-12 items-center justify-between gap-3 py-3"
                    >
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm text-foreground">
                          {{ subAccount.displayName }}
                        </p>
                      </div>

                      <div class="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          class="h-8 px-3 text-[13px]"
                          :disabled="subAccountSubmitting || Boolean(deletingSubAccountId)"
                          @click="openEditSubAccountDialog(subAccount)"
                        >
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          class="h-8 px-3 text-[13px] text-destructive hover:text-destructive"
                          :disabled="subAccountSubmitting || Boolean(deletingSubAccountId)"
                          @click="handleDeleteSubAccount(subAccount)"
                        >
                          <LoaderCircle
                            v-if="deletingSubAccountId === subAccount.id"
                            class="mr-1 h-4 w-4 animate-spin"
                          />
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </section>

            <DialogFooter class="pt-2">
              <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" :disabled="subAccountManagerBusy" @click="resetSubAccountManagerDialogState">
                  关闭
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  class="h-8 px-3 text-[13px]"
                  :disabled="subAccountManagerBusy"
                  @click="reloadManagedSubAccounts"
                >
                  <LoaderCircle v-if="subAccountsLoading" class="mr-1 h-4 w-4 animate-spin" />
                  刷新
                </Button>
                <Button
                  type="button"
                  class="h-8 px-3 text-[13px]"
                  :disabled="subAccountManagerBusy"
                  @click="openCreateSubAccountDialog"
                >
                  新增子账号
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog :open="subAccountDialogOpen" @update:open="handleSubAccountDialogOpenChange">
        <DialogContent class="sm:max-w-md" :show-close-button="!subAccountSubmitting">
          <DialogHeader class="pr-8">
            <DialogTitle>{{ isEditSubAccountMode ? '编辑子账号' : '新增子账号' }}</DialogTitle>
            <DialogDescription>
              {{
                isEditSubAccountMode
                  ? '修改子账号名称，密码留空则保持不变。'
                  : '填写子账号名称和密码，所属云账号 UIN 会自动使用当前账号。'
              }}
            </DialogDescription>
          </DialogHeader>

          <form class="grid gap-4" @submit.prevent="handleSubmitSubAccount">
            <BaseInput
              v-model="subAccountForm.name"
              label="子账号名称"
              placeholder="如：ops-admin"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
            />

            <BaseInput
              v-model="subAccountForm.password"
              label="子账号密码"
              type="password"
              :placeholder="isEditSubAccountMode ? '留空则不修改密码' : '请输入子账号密码'"
              autocomplete="new-password"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
            />

            <p v-if="subAccountFormError" class="text-sm text-destructive">{{ subAccountFormError }}</p>

            <DialogFooter class="pt-2">
              <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" :disabled="subAccountSubmitting" @click="resetSubAccountEditorState">
                  取消
                </Button>
                <BaseButton
                  :label="isEditSubAccountMode ? '保存修改' : '确认新增'"
                  type="submit"
                  :loading="subAccountSubmitting"
                  :loading-text="isEditSubAccountMode ? '保存中' : '提交中'"
                />
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog :open="quickLoginDialogOpen" @update:open="handleQuickLoginDialogOpenChange">
        <DialogContent class="sm:max-w-lg" :show-close-button="!quickLoginDialogBusy">
          <DialogHeader class="pr-8">
            <DialogTitle>选择子账号</DialogTitle>
            <DialogDescription>
              {{ quickLoginDialogAccount?.name }} 下存在多个子账号，请选择一个账号完成快捷登录。
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4">
            <Alert v-if="quickLoginError" variant="destructive">
              <AlertTitle>快捷登录失败</AlertTitle>
              <AlertDescription>{{ quickLoginError }}</AlertDescription>
            </Alert>

            <div class="grid max-h-80 gap-2 overflow-y-auto pr-1">
              <div
                v-for="subAccount in quickLoginCandidates"
                :key="subAccount.id"
                class="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-foreground">
                    {{ subAccount.displayName }}
                  </p>
                  <p class="mt-1 text-sm text-muted-foreground">
                    子账号名 {{ subAccount.name }}
                    <span v-if="subAccount.uin"> · UIN {{ subAccount.uin }}</span>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  class="h-8 shrink-0 px-3 text-[13px]"
                  :disabled="Boolean(quickLoginSubmittingId)"
                  @click="performQuickLogin(subAccount)"
                >
                  <LoaderCircle
                    v-if="quickLoginSubmittingId === subAccount.id"
                    class="mr-1 h-4 w-4 animate-spin"
                  />
                  快捷登录
                </Button>
              </div>
            </div>

            <DialogFooter>
              <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" :disabled="quickLoginDialogBusy" @click="resetQuickLoginDialogState">
                  取消
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog :open="quickLoginPasswordDialogOpen" @update:open="handleQuickLoginPasswordDialogOpenChange">
        <DialogContent class="sm:max-w-md" :show-close-button="!quickLoginPasswordDialogBusy">
          <DialogHeader class="pr-8">
            <DialogTitle>复制登录密码</DialogTitle>
            <DialogDescription>
              已打开快捷登录页。自动复制失败时，可在这里手动复制密码。
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4">
            <div class="rounded-md border border-input bg-muted/30 px-3 py-3 font-mono text-sm break-all text-foreground">
              {{ quickLoginPasswordValue }}
            </div>

            <DialogFooter>
              <div class="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  :disabled="quickLoginPasswordDialogBusy"
                  @click="resetQuickLoginPasswordDialogState"
                >
                  关闭
                </Button>
                <Button
                  type="button"
                  :disabled="quickLoginPasswordDialogBusy"
                  @click="handleCopyQuickLoginPassword"
                >
                  <LoaderCircle v-if="quickLoginPasswordCopying" class="mr-1 h-4 w-4 animate-spin" />
                  复制密码
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </template>

    <EmptyState
      v-else
      :title="`${activeCategoryTabLabel}功能建设中`"
      :description="`${activeCategoryTabLabel}页签已预留在云账号标题栏，后续可在这里接入对应列表与操作能力。`"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ChevronDown, LoaderCircle, LogIn, PencilLine, Users } from 'lucide-vue-next';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { TooltipWrap } from '@/components/ui/tooltip';
import { useHorizontalOverflowMask } from '@/composables/useHorizontalOverflowMask';
import { useSlidingTabIndicator } from '@/composables/useSlidingTabIndicator';
import { ACCOUNT_STATUS_OPTIONS, formatAccountStatus, isValidAccountStatus } from '@/services/accounts';
import {
  createSubAccount,
  deleteSubAccount,
  getSubAccountQuickLogin,
  getSubAccounts,
  updateSubAccount,
} from '@/services/subaccounts';
import type { CloudAccount, SubAccount } from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { useAppStore } from '@/store/app';
import { formatDateTimeWithMinutes } from '@/utils/time';

type DialogMode = 'create' | 'edit';
type SubAccountDialogMode = 'create' | 'edit';
type AccountCategoryTab = 'tencent' | 'filing' | 'bt' | 'review' | 'certificate';
type AccountDetailField = {
  label: string;
  value: string;
  numeric?: boolean;
  danger?: boolean;
};
type AccountStatusBadgeTone = 'green' | 'red';
type AccountStatusBadgeIcon = 'check' | 'alert';

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
const expandedAccountIds = ref<string[]>([]);
const activeCategoryTab = ref<AccountCategoryTab>('tencent');
const subAccounts = ref<SubAccount[]>([]);
const subAccountsLoading = ref(false);
const subAccountError = ref('');
const subAccountManagerDialogOpen = ref(false);
const subAccountOwnerAccount = ref<CloudAccount | null>(null);
const subAccountDialogOpen = ref(false);
const subAccountDialogMode = ref<SubAccountDialogMode>('create');
const selectedSubAccount = ref<SubAccount | null>(null);
const subAccountFormError = ref('');
const subAccountSubmitting = ref(false);
const deletingSubAccountId = ref('');
const quickLoginDialogOpen = ref(false);
const quickLoginDialogAccount = ref<CloudAccount | null>(null);
const quickLoginCandidates = ref<SubAccount[]>([]);
const quickLoginError = ref('');
const quickLoginLoading = ref(false);
const quickLoginLoadingAccountId = ref('');
const quickLoginSubmittingId = ref('');
const quickLoginPasswordDialogOpen = ref(false);
const quickLoginPasswordValue = ref('');
const quickLoginPasswordCopying = ref(false);
const form = reactive({
  name: '',
  region: 'ap-shanghai',
  secretId: '',
  secretKey: '',
  status: '1',
});
const subAccountForm = reactive({
  name: '',
  password: '',
});
const rows = computed(() => accountsStore.accountList);
const accountMasonryColumnCount = ref(1);
const accountColumns = computed(() => {
  const columnCount = accountMasonryColumnCount.value;
  const columns = Array.from({ length: columnCount }, () => [] as CloudAccount[]);

  rows.value.forEach((account, index) => {
    columns[index % columnCount].push(account);
  });

  return columns;
});
const isEditMode = computed(() => dialogMode.value === 'edit');
const dialogBusy = computed(
  () => submitting.value || deleting.value,
);
const subAccountManagerBusy = computed(
  () =>
    subAccountsLoading.value ||
    subAccountSubmitting.value ||
    subAccountDialogOpen.value ||
    Boolean(deletingSubAccountId.value),
);
const quickLoginDialogBusy = computed(() => quickLoginLoading.value || Boolean(quickLoginSubmittingId.value));
const quickLoginPasswordDialogBusy = computed(() => quickLoginPasswordCopying.value);
const isEditSubAccountMode = computed(() => subAccountDialogMode.value === 'edit');
const accountStatusBadgeMap: Record<string, { tone: AccountStatusBadgeTone; icon: AccountStatusBadgeIcon }> = {
  正常: { tone: 'green', icon: 'check' },
  异常: { tone: 'red', icon: 'alert' },
};
const accountCategoryTabs = [
  { value: 'tencent', label: '腾讯云' },
  { value: 'filing', label: '备案' },
  { value: 'bt', label: '宝塔' },
  { value: 'review', label: '审核' },
  { value: 'certificate', label: '证书' },
] as const;
const activeCategoryTabLabel = computed(
  () => accountCategoryTabs.find((tab) => tab.value === activeCategoryTab.value)?.label ?? '当前',
);
const managedAccountSubAccounts = computed(() => {
  const account = subAccountOwnerAccount.value;
  if (!account) {
    return [];
  }

  return subAccounts.value.filter((item) => isSubAccountOwnedByAccount(item, account));
});
const {
  indicatorStyle: accountCategoryIndicatorStyle,
  setTabRef: setAccountCategoryTabRef,
} = useSlidingTabIndicator({
  activeKey: activeCategoryTab,
  watchSource: computed(() => accountCategoryTabs.map((tab) => `${tab.value}:${tab.label}`)),
});
const {
  scrollViewportRef: accountCategoryTabsScrollViewportRef,
  overflowLeft: accountCategoryTabsOverflowLeft,
  overflowRight: accountCategoryTabsOverflowRight,
  handleScroll: handleAccountCategoryTabsScroll,
} = useHorizontalOverflowMask({
  watchSource: computed(() => accountCategoryTabs.map((tab) => `${tab.value}:${tab.label}`)),
});

let accountMasonryMediaQuery: MediaQueryList | null = null;

function syncAccountMasonryColumnCount() {
  accountMasonryColumnCount.value = accountMasonryMediaQuery?.matches ? 3 : 1;
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  accountMasonryMediaQuery = window.matchMedia('(min-width: 768px)');
  syncAccountMasonryColumnCount();
  accountMasonryMediaQuery.addEventListener('change', syncAccountMasonryColumnCount);
});

onBeforeUnmount(() => {
  accountMasonryMediaQuery?.removeEventListener('change', syncAccountMasonryColumnCount);
  accountMasonryMediaQuery = null;
});

watch(rows, (accounts) => {
  const validIds = new Set(accounts.map((account) => account.id));
  expandedAccountIds.value = expandedAccountIds.value.filter((id) => validIds.has(id));
}, { immediate: true });

async function reloadAccounts() {
  tableError.value = '';
  try {
    await accountsStore.hydrateFromService();
  } catch (error) {
    tableError.value = error instanceof Error ? error.message : '拉取账号失败';
  }
}

async function loadDialogSubAccounts() {
  subAccountsLoading.value = true;
  subAccountError.value = '';

  try {
    subAccounts.value = await getSubAccounts();
  } catch (error) {
    subAccountError.value = error instanceof Error ? error.message : '拉取子账号失败';
  } finally {
    subAccountsLoading.value = false;
  }
}

async function loadOwnedSubAccounts(account: CloudAccount) {
  const list = await getSubAccounts();
  subAccounts.value = list;
  return list.filter((item) => isSubAccountOwnedByAccount(item, account));
}

async function reloadManagedSubAccounts() {
  if (!subAccountOwnerAccount.value) {
    subAccountError.value = '当前未选中云账号';
    return;
  }

  await loadDialogSubAccounts();
}

async function openSubAccountManagerDialog(account: CloudAccount) {
  subAccountOwnerAccount.value = account;
  subAccountManagerDialogOpen.value = true;
  subAccountError.value = '';

  await reloadManagedSubAccounts();
}

function handleSubAccountManagerDialogOpenChange(open: boolean) {
  if (subAccountManagerBusy.value) {
    return;
  }

  subAccountManagerDialogOpen.value = open;
  if (!open) {
    resetSubAccountManagerDialogState();
  }
}

function resetSubAccountManagerDialogState() {
  if (subAccountSubmitting.value) {
    return;
  }

  subAccountManagerDialogOpen.value = false;
  subAccountOwnerAccount.value = null;
  subAccountError.value = '';
  deletingSubAccountId.value = '';
}

function openCreateSubAccountDialog() {
  if (!subAccountOwnerAccount.value) {
    subAccountError.value = '当前未选中云账号';
    return;
  }

  subAccountDialogMode.value = 'create';
  selectedSubAccount.value = null;
  subAccountFormError.value = '';
  subAccountForm.name = '';
  subAccountForm.password = '';
  subAccountDialogOpen.value = true;
}

function openEditSubAccountDialog(subAccount: SubAccount) {
  subAccountDialogMode.value = 'edit';
  selectedSubAccount.value = subAccount;
  subAccountFormError.value = '';
  subAccountForm.name = subAccount.name;
  subAccountForm.password = '';
  subAccountDialogOpen.value = true;
}

function handleSubAccountDialogOpenChange(open: boolean) {
  if (subAccountSubmitting.value) {
    return;
  }

  subAccountDialogOpen.value = open;
  if (!open) {
    resetSubAccountEditorState();
  }
}

function resetSubAccountEditorState() {
  subAccountDialogOpen.value = false;
  subAccountDialogMode.value = 'create';
  selectedSubAccount.value = null;
  resetSubAccountForm();
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
  form.status = isValidAccountStatus(account.statusCode) ? String(account.statusCode) : '1';
}

function isAccountExpanded(accountId: string) {
  return expandedAccountIds.value.includes(accountId);
}

function toggleAccountDetails(accountId: string) {
  expandedAccountIds.value = isAccountExpanded(accountId)
    ? expandedAccountIds.value.filter((id) => id !== accountId)
    : [...expandedAccountIds.value, accountId];
}

function handleQuickLoginDialogOpenChange(open: boolean) {
  if (quickLoginDialogBusy.value) {
    return;
  }

  quickLoginDialogOpen.value = open;
  if (!open) {
    resetQuickLoginDialogState();
  }
}

function resetQuickLoginDialogState() {
  quickLoginDialogOpen.value = false;
  quickLoginDialogAccount.value = null;
  quickLoginCandidates.value = [];
  quickLoginError.value = '';
  quickLoginLoading.value = false;
  quickLoginLoadingAccountId.value = '';
  quickLoginSubmittingId.value = '';
}

function handleQuickLoginPasswordDialogOpenChange(open: boolean) {
  if (quickLoginPasswordDialogBusy.value) {
    return;
  }

  quickLoginPasswordDialogOpen.value = open;
  if (!open) {
    resetQuickLoginPasswordDialogState();
  }
}

function resetQuickLoginPasswordDialogState() {
  quickLoginPasswordDialogOpen.value = false;
  quickLoginPasswordValue.value = '';
}

async function copyTextToClipboard(text: string) {
  if (!text) {
    return false;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to execCommand below.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

async function handleCopyQuickLoginPassword() {
  if (!quickLoginPasswordValue.value) {
    return;
  }

  quickLoginPasswordCopying.value = true;
  let copied = false;
  try {
    copied = await copyTextToClipboard(quickLoginPasswordValue.value);
    if (!copied) {
      throw new Error('复制失败，请手动复制密码');
    }

    appStore.setNotice('密码已复制', 'info');
  } catch (error) {
    appStore.setNotice(error instanceof Error ? error.message : '复制失败，请手动复制密码', 'error');
  } finally {
    quickLoginPasswordCopying.value = false;
    if (copied) {
      resetQuickLoginPasswordDialogState();
    }
  }
}

async function performQuickLogin(subAccount: SubAccount) {
  const tencentAccountUin = parseOptionalInteger(subAccount.tencentAccountUin ?? '');

  if (typeof tencentAccountUin !== 'number') {
    throw new Error('当前子账号所属云账号 UIN 缺失或不合法');
  }

  quickLoginSubmittingId.value = subAccount.id;

  try {
    const result = await getSubAccountQuickLogin({
      subAccountName: subAccount.name,
      tencentAccountUin,
    });

    if (!result.loginUrl) {
      throw new Error('后端未返回快捷登录地址');
    }

    const copied = await copyTextToClipboard(result.password);
    const loginWindow = window.open(result.loginUrl, '_blank');
    if (!loginWindow) {
      throw new Error('新标签页打开失败，请检查浏览器弹窗权限');
    }

    if (!result.password) {
      appStore.setNotice('已打开登录页，但后端未返回密码', 'info');
    } else if (copied) {
      appStore.setNotice('已打开登录页，密码已复制', 'info');
    } else {
      quickLoginPasswordValue.value = result.password;
      quickLoginPasswordDialogOpen.value = true;
      appStore.setNotice('已打开登录页，请在弹窗里点击复制密码', 'info');
    }

    resetQuickLoginDialogState();
  } finally {
    quickLoginSubmittingId.value = '';
  }
}

async function handleQuickLogin(account: CloudAccount) {
  quickLoginError.value = '';
  quickLoginLoading.value = true;
  quickLoginLoadingAccountId.value = account.id;
  quickLoginDialogAccount.value = account;

  try {
    const ownedSubAccounts = await loadOwnedSubAccounts(account);

    if (ownedSubAccounts.length === 0) {
      appStore.setNotice(`${account.name} 暂无可用子账号，请先维护子账号信息`, 'error');
      resetQuickLoginDialogState();
      return;
    }

    if (ownedSubAccounts.length === 1) {
      await performQuickLogin(ownedSubAccounts[0]);
      return;
    }

    quickLoginCandidates.value = ownedSubAccounts;
    quickLoginDialogOpen.value = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : '快捷登录失败';
    quickLoginError.value = message;
    appStore.setNotice(message, 'error');
  } finally {
    quickLoginLoading.value = false;
    quickLoginLoadingAccountId.value = '';
  }
}

function handleDialogOpenChange(open: boolean) {
  if (dialogBusy.value) {
    return;
  }

  dialogOpen.value = open;
  if (!open) {
    resetDialogState();
  }
}

function handleCancelDialog() {
  if (dialogBusy.value) {
    return;
  }

  dialogOpen.value = false;
  resetDialogState();
}

function resetForm() {
  formError.value = '';
  deleteConfirming.value = false;
  form.name = '';
  form.region = 'ap-shanghai';
  form.secretId = '';
  form.secretKey = '';
  form.status = '1';
}

function resetSubAccountForm() {
  subAccountFormError.value = '';
  subAccountForm.name = '';
  subAccountForm.password = '';
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

  return isValidAccountStatus(parsed) ? parsed : null;
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function isSubAccountOwnedByAccount(subAccount: SubAccount, account: CloudAccount) {
  const accountUuid = account.uuid?.trim();
  const accountUin = account.uin?.trim();
  const accountName = account.name.trim();
  const subAccountUuid = subAccount.tencentAccountUuid?.trim();
  const subAccountUin = subAccount.tencentAccountUin?.trim();
  const subAccountName = subAccount.tencentAccountName.trim();

  return (
    (accountUuid && subAccountUuid && accountUuid === subAccountUuid) ||
    (accountUin && subAccountUin && accountUin === subAccountUin) ||
    (accountName && subAccountName && accountName === subAccountName)
  );
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
        throw new Error('账号状态只能是正常或异常');
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

async function handleSubmitSubAccount() {
  subAccountFormError.value = '';

  const subAccountName = subAccountForm.name.trim();
  const password = subAccountForm.password.trim();

  if (!subAccountName) {
    subAccountFormError.value = '子账号名称不能为空';
    return;
  }

  if (!isEditSubAccountMode.value && !password) {
    subAccountFormError.value = '子账号密码不能为空';
    return;
  }

  subAccountSubmitting.value = true;
  try {
    if (isEditSubAccountMode.value) {
      const subAccount = selectedSubAccount.value;

      if (typeof subAccount?.recordId !== 'number') {
        throw new Error('当前子账号缺少可编辑的 Id');
      }

      await updateSubAccount({
        id: subAccount.recordId,
        password: password || undefined,
        status: 1,
        subAccountName,
      });
      appStore.setNotice('子账号已更新', 'info');
    } else {
      const account = subAccountOwnerAccount.value;
      if (!account) {
        throw new Error('当前未选中云账号');
      }

      const tencentAccountUin = parseOptionalInteger(account.uin ?? '');
      if (typeof tencentAccountUin !== 'number') {
        throw new Error('当前云账号 UIN 缺失或不合法');
      }

      await createSubAccount({
        password,
        subAccountName,
        tencentAccountName: account.name,
        tencentAccountUin,
        tencentAccountUuid: account.uuid,
      });
      appStore.setNotice('子账号已新增', 'info');
    }

    resetSubAccountEditorState();
    await reloadManagedSubAccounts();
  } catch (error) {
    subAccountFormError.value = error instanceof Error
      ? error.message
      : isEditSubAccountMode.value
        ? '编辑子账号失败'
        : '新增子账号失败';
  } finally {
    subAccountSubmitting.value = false;
  }
}

async function handleDeleteSubAccount(subAccount: SubAccount) {
  if (typeof subAccount.recordId !== 'number') {
    subAccountError.value = '当前子账号缺少可删除的 Id';
    return;
  }

  deletingSubAccountId.value = subAccount.id;
  subAccountError.value = '';
  try {
    await deleteSubAccount({
      id: subAccount.recordId,
      subAccountName: subAccount.name,
    });
    appStore.setNotice('子账号已删除', 'info');
    await reloadManagedSubAccounts();
  } catch (error) {
    subAccountError.value = error instanceof Error ? error.message : '删除子账号失败';
  } finally {
    deletingSubAccountId.value = '';
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

function isLowAvailableBalance(value?: number) {
  return typeof value === 'number' && !Number.isNaN(value) && value < 1000;
}

function getAccountStatusBadge(statusCode?: number, fallback?: string) {
  const label = formatAccountStatus(statusCode, fallback);
  const preset = accountStatusBadgeMap[label] ?? accountStatusBadgeMap.异常;

  return {
    label,
    tone: preset.tone,
    icon: preset.icon,
  };
}

function getAccountMetaFields(account: CloudAccount): AccountDetailField[] {
  return [
    { label: '地域', value: account.region || '--' },
    { label: '账户 UIN', value: account.uin ?? '--', numeric: true },
    { label: '账号编号', value: account.recordId === undefined ? '--' : String(account.recordId), numeric: true },
    { label: '创建时间', value: formatOptionalDateTime(account.createdAt) },
    { label: '更新时间', value: formatOptionalDateTime(account.updatedAt || account.lastSyncedAt) },
    { label: '凭据状态', value: account.credentialConfigured === false ? '未配置' : '已配置' },
  ];
}

function getAccountBalanceFields(account: CloudAccount): AccountDetailField[] {
  return [
    { label: '现金余额', value: formatCurrency(account.cashAccountBalance) },
    { label: '赠送金余额', value: formatCurrency(account.presentAccountBalance) },
    { label: '冻结余额', value: formatCurrency(account.freezeAmount) },
    { label: '欠费余额', value: formatCurrency(account.oweAmount), danger: typeof account.oweAmount === 'number' && account.oweAmount > 0 },
  ];
}

function handleExpandBeforeEnter(element: Element) {
  const target = element as HTMLElement;
  target.style.height = '0';
  target.style.opacity = '0';
  target.style.overflow = 'hidden';
}

function handleExpandEnter(element: Element) {
  const target = element as HTMLElement;
  target.style.transition = 'height 220ms cubic-bezier(0.2, 0, 0, 1), opacity 180ms ease-out';
  target.style.height = `${target.scrollHeight}px`;
  target.style.opacity = '1';
}

function handleExpandAfterEnter(element: Element) {
  const target = element as HTMLElement;
  target.style.height = 'auto';
  target.style.opacity = '1';
  target.style.overflow = '';
  target.style.transition = '';
}

function handleExpandBeforeLeave(element: Element) {
  const target = element as HTMLElement;
  target.style.height = `${target.scrollHeight}px`;
  target.style.opacity = '1';
  target.style.overflow = 'hidden';
}

function handleExpandLeave(element: Element) {
  const target = element as HTMLElement;
  target.style.transition = 'height 180ms cubic-bezier(0.4, 0, 1, 1), opacity 140ms ease-in';
  void target.offsetHeight;
  target.style.height = '0';
  target.style.opacity = '0';
}

function handleExpandAfterLeave(element: Element) {
  const target = element as HTMLElement;
  target.style.height = '';
  target.style.opacity = '';
  target.style.overflow = '';
  target.style.transition = '';
}
</script>
