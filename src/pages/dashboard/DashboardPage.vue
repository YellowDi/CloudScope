<template>
  <section class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
    <header class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-2">
        <h1 class="leading-none font-semibold tracking-tight text-foreground text-[24px] sm:text-[28px] xl:text-[32px]">
            资源总览
        </h1>
        <p class="max-w-3xl text-[18px] leading-none font-normal text-muted-foreground sm:text-[20px]">
          支持查看全部账号聚合数据，也可切换到单个账号查看 CVM 与 TencentDB 资源状态。
        </p>
      </div>

      <div
        v-if="!showEmpty"
        class="flex flex-col gap-3 border-b border-border md:flex-row md:items-end md:justify-between"
      >
        <div class="relative min-w-0 flex-1 overflow-visible">
          <div
            class="min-w-0 -mt-1 overflow-x-auto whitespace-nowrap pt-1"
          >
            <nav class="relative flex min-w-max flex-nowrap items-center text-[14px]">
              <button
                v-for="tab in accountScopeTabs"
                :key="tab.value"
                :ref="(element) => setAccountTabRef(tab.value, element)"
                type="button"
                :title="tab.title"
                :aria-pressed="activeScope === tab.value"
                :class="[
                  'group relative shrink-0 px-3 pb-[11px] text-muted-foreground transition-colors hover:text-foreground',
                  'duration-180 ease-out',
                  activeScope === tab.value ? 'font-semibold text-foreground' : '',
                ]"
                @click="handleSelectScope(tab.value)"
              >
                <span class="relative isolate inline-block">
                  <span class="pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-md transition-colors group-hover:[background:var(--interactive-hover,rgba(0,0,0,0.045))]" />
                  <span class="relative z-10">{{ tab.label }}</span>
                </span>
              </button>
              <span
                aria-hidden="true"
                class="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-foreground transition-[transform,width,opacity] duration-300 ease-out"
                :style="accountIndicatorStyle"
              />
            </nav>
          </div>
        </div>

        <div class="flex shrink-0 items-center justify-end pb-2">
          <Button
            variant="outline"
            class="h-8 gap-1 px-3 text-[14px]"
            :disabled="refreshing"
            @click="loadData(true)"
          >
            <LoaderCircle v-if="refreshing" class="h-4 w-4 animate-spin" />
            刷新数据
          </Button>
        </div>
      </div>
    </header>

    <EmptyState
      v-if="showEmpty"
      title="暂无云账号"
      description="请先创建云账号，再查看资源概览。"
      action-label="前往账号管理"
      action-to="/accounts"
    />

    <template v-else>
      <Alert v-if="errorMessage" variant="destructive">
        <AlertTitle>数据加载失败</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="CVM 总数" :value="formatCount(stats?.cvmTotal ?? 0)" meta="腾讯云云服务器实例" :loading="loading" />
        <StatCard label="数据库总数" :value="formatCount(stats?.databaseTotal ?? 0)" meta="TencentDB 实例" :loading="loading" />
        <StatCard label="运行中实例数" :value="formatCount(stats?.runningCount ?? 0)" meta="跨资源聚合统计" :loading="loading" />
        <StatCard label="异常实例数" :value="formatCount(stats?.abnormalCount ?? 0)" meta="所有非运行态实例" :loading="loading" />
        <Card
          class="cursor-pointer border-border bg-muted shadow-sm transition-colors hover:border-primary/40"
          @click="showBalanceCards = !showBalanceCards"
        >
          <CardContent class="flex min-w-0 flex-col gap-2 p-3">
            <p class="truncate whitespace-nowrap text-xs text-muted-foreground">账户余额</p>
            <template v-if="loading">
              <h3 class="truncate whitespace-nowrap text-2xl font-semibold tracking-tight text-foreground">--</h3>
              <p class="truncate whitespace-nowrap text-xs text-muted-foreground">点击展开现金、信用与欠费明细</p>
            </template>
            <template v-else>
              <h3 class="truncate whitespace-nowrap text-2xl font-semibold tracking-tight text-foreground">
                {{ balanceSummary?.availableBalance ?? '--' }}
              </h3>
              <p class="truncate whitespace-nowrap text-xs text-muted-foreground">
                {{ showBalanceCards ? '点击收起现金、信用与欠费明细' : '点击展开现金、信用与欠费明细' }}
              </p>
            </template>
          </CardContent>
        </Card>
      </div>

      <div v-if="showBalanceCards" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="账户可用余额"
          :value="balanceSummary?.availableBalance ?? '--'"
          :meta="balanceAvailableMeta"
          :loading="loading"
        />
        <StatCard
          label="现金账户余额"
          :value="balanceSummary?.cashBalance ?? '--'"
          :meta="balanceCashMeta"
          :loading="loading"
        />
        <StatCard
          label="可用信用额度"
          :value="balanceSummary?.creditBalance ?? '--'"
          :meta="balanceCreditMeta"
          :loading="loading"
        />
        <StatCard
          label="欠费金额"
          :value="balanceSummary?.oweAmount ?? '--'"
          :meta="balanceOweMeta"
          :loading="loading"
        />
      </div>

      <div class="flex min-h-0 flex-1 flex-col gap-4">
        <Tabs v-model="activeResourceTab" class="flex min-h-0 flex-1 flex-col gap-4">
          <div class="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-between">
            <TopTabSwitch
              :tabs="resourceSwitchTabs"
              :model-value="activeResourceTab"
              :collapse-inactive="false"
              tone="default"
              aria-label="资源类型切换"
              @update:model-value="handleResourceTabChange"
            />

            <div v-if="activeResourceTab === 'cvm'" class="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Input
                v-model="cvmSearchKeyword"
                class="h-9 min-w-0 flex-1"
                placeholder="搜索实例 ID、名称、IP、配置、可用区、备注"
              />
              <div class="w-[5.5rem] shrink-0 sm:w-36">
                <BaseSelect
                  v-model="cvmStatusFilter"
                  :options="cvmStatusOptions"
                />
              </div>
              <p class="shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
                {{ formatCount(filteredCvmRows.length) }} / {{ formatCount(cvmRows.length) }}
              </p>
              <Button variant="ghost" size="sm" class="shrink-0" @click="resetCvmFilters">清空筛选</Button>
            </div>

            <div v-else class="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Input
                v-model="databaseSearchKeyword"
                class="h-9 min-w-0 flex-1"
                placeholder="搜索实例 ID、名称、类型、IP、可用区"
              />
              <div class="w-[5.5rem] shrink-0 sm:w-32">
                <BaseSelect
                  v-model="databaseStatusFilter"
                  :options="databaseStatusOptions"
                />
              </div>
              <div class="w-[5.5rem] shrink-0 sm:w-32">
                <BaseSelect
                  v-model="databaseTypeFilter"
                  :options="databaseTypeOptions"
                />
              </div>
              <p class="shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
                {{ formatCount(filteredDatabaseRows.length) }} / {{ formatCount(databaseRows.length) }}
              </p>
              <Button variant="ghost" size="sm" class="shrink-0" @click="resetDatabaseFilters">清空筛选</Button>
            </div>
          </div>

          <TabsContent value="cvm" class="mt-0 min-h-0 flex-1">
            <div class="flex min-h-0 flex-1 flex-col">
              <TablePageTable
                :columns="visibleCvmColumns"
                :rows="paginatedCvmRows"
                row-key="rowId"
                :loading="loading"
                :show-index="true"
                :sticky-header="true"
                :edge-gutter="true"
                :list-level-table="false"
                :summary="cvmTableSummary"
              >
                <template #cell-status="{ row }">
                  <StatusTag :status="String(row.status)" />
                </template>
                <template #cell-chargeType="{ row }">
                  <div class="inline-flex w-max items-center gap-2 py-1 whitespace-nowrap">
                    <span
                      class="shrink-0 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium"
                      :class="getExpirationInfo(row).badgeClass"
                    >
                      {{ getChargeTypeLabel(row) }}
                    </span>
                    <p class="shrink-0 text-[13px] leading-5 font-medium text-foreground">
                      {{ getExpirationInfo(row).dateText }}
                    </p>
                    <p
                      v-if="getExpirationInfo(row).relativeText"
                      class="shrink-0 text-xs leading-4"
                      :class="getExpirationInfo(row).textClass"
                    >
                      {{ getExpirationInfo(row).relativeText }}
                    </p>
                  </div>
                </template>
                <template #empty>
                  <EmptyState
                    :title="hasCvmFilters ? '没有匹配的 CVM 实例' : '暂无 CVM 实例'"
                    :description="hasCvmFilters ? '请调整搜索关键词或状态筛选条件。' : cvmEmptyDescription"
                  />
                </template>
              </TablePageTable>

              <div v-if="cvmPageCount > 1" class="min-w-0 shrink-0 pt-3">
                <Pagination
                  v-model:page="cvmPage"
                  :items-per-page="DASHBOARD_PAGE_SIZE"
                  :total="filteredCvmRows.length"
                  :sibling-count="1"
                  class="w-full justify-end"
                >
                  <PaginationContent v-slot="{ items }" class="justify-end">
                    <PaginationFirst />
                    <PaginationPrevious />
                    <template
                      v-for="(item, index) in items"
                      :key="`${item.type}-${item.type === 'page' ? item.value : index}`"
                    >
                      <PaginationItem
                        v-if="item.type === 'page'"
                        :value="item.value"
                        :is-active="item.value === cvmPage"
                      >
                        {{ item.value }}
                      </PaginationItem>
                      <PaginationEllipsis v-else />
                    </template>
                    <PaginationNext />
                    <PaginationLast />
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="database" class="mt-0 min-h-0 flex-1">
            <div class="flex min-h-0 flex-1 flex-col">
              <TablePageTable
                :columns="visibleDatabaseColumns"
                :rows="paginatedDatabaseRows"
                row-key="rowId"
                :loading="loading"
                :show-index="true"
                :sticky-header="true"
                :edge-gutter="true"
                :list-level-table="false"
                :summary="databaseTableSummary"
              >
                <template #cell-status="{ row }">
                  <StatusTag :status="String(row.status)" />
                </template>
                <template #cell-chargeType="{ row }">
                  <div class="inline-flex w-max items-center gap-2 py-1 whitespace-nowrap">
                    <span
                      class="shrink-0 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium"
                      :class="getExpirationInfo(row).badgeClass"
                    >
                      {{ getChargeTypeLabel(row) }}
                    </span>
                    <p class="shrink-0 text-[13px] leading-5 font-medium text-foreground">
                      {{ getExpirationInfo(row).dateText }}
                    </p>
                    <p
                      v-if="getExpirationInfo(row).relativeText"
                      class="shrink-0 text-xs leading-4"
                      :class="getExpirationInfo(row).textClass"
                    >
                      {{ getExpirationInfo(row).relativeText }}
                    </p>
                  </div>
                </template>
                <template #empty>
                  <EmptyState
                    :title="hasDatabaseFilters ? '没有匹配的数据库实例' : '暂无数据库实例'"
                    :description="hasDatabaseFilters ? '请调整搜索关键词、状态或类型筛选条件。' : databaseEmptyDescription"
                  />
                </template>
              </TablePageTable>

              <div v-if="databasePageCount > 1" class="min-w-0 shrink-0 pt-3">
                <Pagination
                  v-model:page="databasePage"
                  :items-per-page="DASHBOARD_PAGE_SIZE"
                  :total="filteredDatabaseRows.length"
                  :sibling-count="1"
                  class="w-full justify-end"
                >
                  <PaginationContent v-slot="{ items }" class="justify-end">
                    <PaginationFirst />
                    <PaginationPrevious />
                    <template
                      v-for="(item, index) in items"
                      :key="`${item.type}-${item.type === 'page' ? item.value : index}`"
                    >
                      <PaginationItem
                        v-if="item.type === 'page'"
                        :value="item.value"
                        :is-active="item.value === databasePage"
                      >
                        {{ item.value }}
                      </PaginationItem>
                      <PaginationEllipsis v-else />
                    </template>
                    <PaginationNext />
                    <PaginationLast />
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';
import BaseSelect from '@/components/BaseSelect.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatCard from '@/components/StatCard.vue';
import StatusTag from '@/components/StatusTag.vue';
import TopTabSwitch from '@/components/TopTabSwitch.vue';
import TablePageTable from '@/components/table-page/TablePageTable.vue';
import { useSlidingTabIndicator } from '@/composables/useSlidingTabIndicator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { getAccountBalanceResponse } from '@/services/billing';
import { getCloudDashboardList } from '@/services/cloud-dashboard';
import { getDatabaseDashboardList } from '@/services/database-dashboard';
import { buildDashboardStats, translateAccountBalance } from '@/services/translators';
import type { TableColumn } from '@/components/table-page/types';
import type {
  AccountBalanceSummary,
  CloudDashboardInstanceItem,
  CloudAccount,
  DashboardStats,
  DatabaseDashboardInstanceItem,
  TencentAccountBalanceResponse,
} from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { formatCount, formatCurrencyFromCent } from '@/utils/format';
import { formatDateTimeWithMinutes } from '@/utils/time';

type DashboardAccountData = {
  balance: TencentAccountBalanceResponse;
};

type ExpirationInfo = {
  dateText: string;
  relativeText: string;
  progressPercent: number | null;
  badgeClass: string;
  fillClass: string;
  textClass: string;
};

const ALL_ACCOUNTS_SCOPE = 'all';
const DASHBOARD_PAGE_SIZE = 10;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 30;
const DEFAULT_EXPIRATION_INFO: ExpirationInfo = {
  dateText: '--',
  relativeText: '',
  progressPercent: null,
  badgeClass: 'bg-muted text-muted-foreground',
  fillClass: 'bg-muted-foreground/40',
  textClass: 'text-muted-foreground',
};
const accountsStore = useAccountsStore();
const stats = ref<DashboardStats | null>(null);
const balanceSummary = ref<AccountBalanceSummary | null>(null);
const cvmRows = ref<CloudDashboardInstanceItem[]>([]);
const databaseRows = ref<DatabaseDashboardInstanceItem[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const errorMessage = ref('');
const loadedAccountCount = ref(0);
const showEmpty = computed(() => !accountsStore.loading && accountsStore.accountList.length === 0);
const activeScope = ref(ALL_ACCOUNTS_SCOPE);
const activeResourceTab = ref<'cvm' | 'database'>('cvm');
const showBalanceCards = ref(false);
const cvmSearchKeyword = ref('');
const cvmStatusFilter = ref('all');
const databaseSearchKeyword = ref('');
const databaseStatusFilter = ref('all');
const databaseTypeFilter = ref('all');
const cvmPage = ref(1);
const databasePage = ref(1);

const cvmColumns: TableColumn[] = [
  { key: 'account', label: '云账号', filterType: 'text', tone: 'muted' },
  { key: 'id', label: '实例 ID' },
  { key: 'name', label: '名称' },
  { key: 'status', label: '状态' },
  { key: 'chargeType', label: '到期时间', tone: 'muted', headerClass: '!w-auto', cellClass: '!w-auto' },
  { key: 'publicIp', label: '公网 IP' },
  { key: 'privateIp', label: '私网 IP' },
  { key: 'spec', label: '配置' },
  { key: 'zone', label: '可用区', tone: 'muted' },
  { key: 'remark', label: '备注', tone: 'muted' },
];

const databaseColumns: TableColumn[] = [
  { key: 'account', label: '云账号', filterType: 'text', tone: 'muted' },
  { key: 'id', label: '实例 ID' },
  { key: 'name', label: '名称' },
  { key: 'type', label: '类型' },
  { key: 'status', label: '状态' },
  { key: 'chargeType', label: '到期时间', tone: 'muted', headerClass: '!w-auto', cellClass: '!w-auto' },
  { key: 'publicIp', label: '公网 IP' },
  { key: 'privateIp', label: '私网 IP' },
  { key: 'storage', label: '存储' },
  { key: 'zone', label: '可用区', tone: 'muted' },
];

const isAllAccountsView = computed(() => activeScope.value === ALL_ACCOUNTS_SCOPE);
const accountScopeTabs = computed(() => [
  { value: ALL_ACCOUNTS_SCOPE, label: '全部', title: undefined },
  ...accountsStore.accountList.map((account) => ({
    value: account.id,
    label: account.name,
    title: `${account.name} · ${account.region}`,
  })),
]);
const {
  indicatorStyle: accountIndicatorStyle,
  setTabRef: setAccountTabRef,
} = useSlidingTabIndicator({
  activeKey: activeScope,
  watchSource: computed(() => accountScopeTabs.value.map((tab) => `${tab.value}:${tab.label}`)),
});
const resourceSwitchTabs = computed(() => [
  { id: 'cvm', label: '云服务器', badge: formatCount(cvmRows.value.length) },
  { id: 'database', label: '数据库', badge: formatCount(databaseRows.value.length) },
]);
const visibleCvmColumns = computed<TableColumn[]>(() =>
  isAllAccountsView.value ? cvmColumns : cvmColumns.filter((column) => column.key !== 'account'),
);

const visibleDatabaseColumns = computed<TableColumn[]>(() =>
  isAllAccountsView.value ? databaseColumns : databaseColumns.filter((column) => column.key !== 'account'),
);

const cvmStatusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已停止', value: 'STOPPED' },
  { label: '启动中', value: 'PENDING' },
];

const databaseStatusOptions = computed(() => {
  const entries = Array.from(new Map(
    databaseRows.value.map((item) => [item.statusCode, item.status] as const),
  ).entries());

  return [
    { label: '全部状态', value: 'all' },
    ...entries.map(([value, label]) => ({ label, value })),
  ];
});

const databaseTypeOptions = computed(() => {
  const values = Array.from(new Set(databaseRows.value.map((item) => item.type)));
  return [
    { label: '全部类型', value: 'all' },
    ...values.map((value) => ({ label: value, value })),
  ];
});

const cvmDisplayRows = computed(() =>
  cvmRows.value.map((row) => ({
    ...row,
    expirationInfo: buildExpirationInfo(row.chargeType, row.expiredTime),
  })),
);

const databaseDisplayRows = computed(() =>
  databaseRows.value.map((row) => ({
    ...row,
    expirationInfo: buildExpirationInfo(row.chargeType, row.expiredTime),
  })),
);

const filteredCvmRows = computed(() => {
  const keyword = cvmSearchKeyword.value.trim().toLowerCase();

  return cvmDisplayRows.value.filter((row) => {
    const matchesKeyword =
      keyword.length === 0 ||
      [
        row.id,
        row.name,
        row.publicIp,
        row.privateIp,
        row.spec,
        row.account,
        row.zone,
        row.chargeType,
        row.expiredTime,
        row.expirationInfo.dateText,
        row.expirationInfo.relativeText,
        row.remark,
      ]
        .some((value) => value.toLowerCase().includes(keyword));

    const matchesStatus =
      cvmStatusFilter.value === 'all' || row.statusCode === cvmStatusFilter.value;

    return matchesKeyword && matchesStatus;
  });
});

const filteredDatabaseRows = computed(() => {
  const keyword = databaseSearchKeyword.value.trim().toLowerCase();

  return databaseDisplayRows.value.filter((row) => {
    const matchesKeyword =
      keyword.length === 0 ||
      [
        row.id,
        row.name,
        row.type,
        row.publicIp,
        row.privateIp,
        row.storage,
        row.zone,
        row.account,
        row.chargeType,
        row.expiredTime,
        row.expirationInfo.dateText,
        row.expirationInfo.relativeText,
      ]
        .some((value) => value.toLowerCase().includes(keyword));

    const matchesStatus =
      databaseStatusFilter.value === 'all' || row.statusCode === databaseStatusFilter.value;

    const matchesType =
      databaseTypeFilter.value === 'all' || row.type === databaseTypeFilter.value;

    return matchesKeyword && matchesStatus && matchesType;
  });
});

const cvmPageCount = computed(() => Math.max(1, Math.ceil(filteredCvmRows.value.length / DASHBOARD_PAGE_SIZE)));
const databasePageCount = computed(() => Math.max(1, Math.ceil(filteredDatabaseRows.value.length / DASHBOARD_PAGE_SIZE)));

const paginatedCvmRows = computed(() => {
  const start = (cvmPage.value - 1) * DASHBOARD_PAGE_SIZE;
  return filteredCvmRows.value.slice(start, start + DASHBOARD_PAGE_SIZE);
});

const paginatedDatabaseRows = computed(() => {
  const start = (databasePage.value - 1) * DASHBOARD_PAGE_SIZE;
  return filteredDatabaseRows.value.slice(start, start + DASHBOARD_PAGE_SIZE);
});

const hasCvmFilters = computed(
  () => cvmSearchKeyword.value.trim().length > 0 || cvmStatusFilter.value !== 'all',
);

const hasDatabaseFilters = computed(
  () =>
    databaseSearchKeyword.value.trim().length > 0 ||
    databaseStatusFilter.value !== 'all' ||
    databaseTypeFilter.value !== 'all',
);

const cvmEmptyDescription = computed(() =>
  isAllAccountsView.value
    ? '全部账号下还没有可展示的云服务器数据。'
    : '当前账号下还没有可展示的云服务器数据。',
);

const databaseEmptyDescription = computed(() =>
  isAllAccountsView.value
    ? '全部账号下还没有可展示的数据库数据。'
    : '当前账号下还没有可展示的数据库数据。',
);

const cvmTableSummary = computed(() => buildPageSummary(cvmPage.value, filteredCvmRows.value.length));
const databaseTableSummary = computed(() => buildPageSummary(databasePage.value, filteredDatabaseRows.value.length));

const balanceAvailableMeta = computed(() => {
  if (!balanceSummary.value) {
    return '获取账户余额（Balance / RealBalance）';
  }

  return isAllAccountsView.value
    ? `已聚合 ${formatCount(loadedAccountCount.value)} 个账号`
    : `账户 UIN ${balanceSummary.value.uin}`;
});

const balanceCashMeta = computed(() => {
  if (!balanceSummary.value) {
    return 'CashAccountBalance';
  }

  return `收益转入 ${balanceSummary.value.incomeBalance} / 赠送余额 ${balanceSummary.value.presentBalance}`;
});

const balanceCreditMeta = computed(() => {
  if (!balanceSummary.value) {
    return 'CreditBalance / RealCreditBalance';
  }

  return `信用总额 ${balanceSummary.value.creditAmount} / 真实可用 ${balanceSummary.value.realCreditBalance}`;
});

const balanceOweMeta = computed(() => {
  if (!balanceSummary.value) {
    return 'OweAmount / FreezeAmount / TempCredit';
  }

  return `冻结金额 ${balanceSummary.value.freezeAmount} / 临时额度 ${balanceSummary.value.tempCredit}`;
});

let loadSequence = 0;

function resetCvmFilters() {
  cvmSearchKeyword.value = '';
  cvmStatusFilter.value = 'all';
}

function resetDatabaseFilters() {
  databaseSearchKeyword.value = '';
  databaseStatusFilter.value = 'all';
  databaseTypeFilter.value = 'all';
}

function handleSelectScope(value: string) {
  activeScope.value = value;
}

function handleResourceTabChange(value: string) {
  if (value === 'cvm' || value === 'database') {
    activeResourceTab.value = value;
  }
}

function clearDashboardData() {
  stats.value = null;
  balanceSummary.value = null;
  cvmRows.value = [];
  databaseRows.value = [];
  loadedAccountCount.value = 0;
}

function getTargetAccounts() {
  if (isAllAccountsView.value) {
    return accountsStore.accountList;
  }

  return accountsStore.accountList.filter((account) => account.id === activeScope.value);
}

function buildPageSummary(page: number, total: number) {
  if (total <= 0) {
    return '';
  }

  const start = (page - 1) * DASHBOARD_PAGE_SIZE + 1;
  const end = Math.min(total, page * DASHBOARD_PAGE_SIZE);
  return `显示第 ${formatCount(start)} - ${formatCount(end)} 条，共 ${formatCount(total)} 条`;
}

function getCalendarDayDiff(expiredTime: string): number | null {
  if (!expiredTime) {
    return null;
  }

  const targetDate = new Date(expiredTime);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  const today = new Date();
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.round((targetDay.getTime() - todayDay.getTime()) / DAY_IN_MS);
}

function buildExpirationInfo(chargeType: string, expiredTime: string): ExpirationInfo {
  if (!expiredTime) {
    return {
      dateText: chargeType === '按量计费' ? '无固定到期' : '--',
      relativeText: '',
      progressPercent: null,
      badgeClass: 'bg-muted text-muted-foreground',
      fillClass: 'bg-muted-foreground/40',
      textClass: 'text-muted-foreground',
    };
  }

  const dayDiff = getCalendarDayDiff(expiredTime);
  const dateText = formatDateTimeWithMinutes(expiredTime);
  if (dayDiff === null || dateText === '--') {
    return {
      dateText: '--',
      relativeText: '',
      progressPercent: null,
      badgeClass: 'bg-muted text-muted-foreground',
      fillClass: 'bg-muted-foreground/40',
      textClass: 'text-muted-foreground',
    };
  }

  if (dayDiff < 0) {
    return {
      dateText,
      relativeText: `到期 ${Math.abs(dayDiff)} 天`,
      progressPercent: Math.min(100, Math.max(14, Math.abs(dayDiff) / EXPIRING_SOON_DAYS * 100)),
      badgeClass: 'bg-rose-500/12 text-rose-700',
      fillClass: 'bg-rose-500',
      textClass: 'text-rose-700',
    };
  }

  if (dayDiff <= EXPIRING_SOON_DAYS) {
    return {
      dateText,
      relativeText: `还剩 ${dayDiff} 天`,
      progressPercent: Math.max(14, dayDiff / EXPIRING_SOON_DAYS * 100),
      badgeClass: 'bg-rose-500/12 text-rose-700',
      fillClass: 'bg-rose-500',
      textClass: 'text-rose-700',
    };
  }

  return {
    dateText,
    relativeText: `还剩 ${dayDiff} 天`,
    progressPercent: 100,
    badgeClass: 'bg-emerald-500/12 text-emerald-700',
    fillClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
  };
}

function getExpirationInfo(row: unknown): ExpirationInfo {
  const expirationInfo = (row as { expirationInfo?: ExpirationInfo } | null)?.expirationInfo;
  return expirationInfo ?? DEFAULT_EXPIRATION_INFO;
}

function getChargeTypeLabel(row: unknown): string {
  const chargeType = (row as { chargeType?: unknown } | null)?.chargeType;
  return typeof chargeType === 'string' && chargeType.trim() ? chargeType : '--';
}

async function loadCloudDashboardRows(): Promise<CloudDashboardInstanceItem[]> {
  const scopedAccount = isAllAccountsView.value
    ? null
    : accountsStore.accountList.find((account) => account.id === activeScope.value) ?? null;
  const { list } = await getCloudDashboardList({
    AccountUUID: scopedAccount?.uuid ?? scopedAccount?.id,
    Full: true,
  });

  return list;
}

async function loadDatabaseDashboardRows(): Promise<DatabaseDashboardInstanceItem[]> {
  const scopedAccount = isAllAccountsView.value
    ? null
    : accountsStore.accountList.find((account) => account.id === activeScope.value) ?? null;
  const { list } = await getDatabaseDashboardList({
    AccountUUID: scopedAccount?.uuid ?? scopedAccount?.id,
    Full: true,
  });

  return list;
}

function mergeAccountBalances(balances: TencentAccountBalanceResponse[]): AccountBalanceSummary | null {
  if (balances.length === 0) {
    return null;
  }

  const totals = balances.reduce(
    (result, { Response: payload }) => {
      result.balance += payload.Balance;
      result.cashBalance += payload.CashAccountBalance;
      result.incomeBalance += payload.IncomeIntoAccountBalance;
      result.presentBalance += payload.PresentAccountBalance;
      result.freezeAmount += payload.FreezeAmount;
      result.oweAmount += payload.OweAmount;
      result.creditAmount += payload.CreditAmount;
      result.creditBalance += payload.CreditBalance;
      result.realCreditBalance += payload.RealCreditBalance;
      result.tempCredit += payload.TempCredit;
      result.tempAmountInfoList.push(...payload.TempAmountInfoList);
      return result;
    },
    {
      balance: 0,
      cashBalance: 0,
      incomeBalance: 0,
      presentBalance: 0,
      freezeAmount: 0,
      oweAmount: 0,
      creditAmount: 0,
      creditBalance: 0,
      realCreditBalance: 0,
      tempCredit: 0,
      tempAmountInfoList: [] as TencentAccountBalanceResponse['Response']['TempAmountInfoList'],
    },
  );

  return {
    uin: `${balances.length} 个账号`,
    availableBalance: formatCurrencyFromCent(totals.balance),
    cashBalance: formatCurrencyFromCent(totals.cashBalance),
    incomeBalance: formatCurrencyFromCent(totals.incomeBalance),
    presentBalance: formatCurrencyFromCent(totals.presentBalance),
    freezeAmount: formatCurrencyFromCent(totals.freezeAmount),
    oweAmount: formatCurrencyFromCent(totals.oweAmount),
    creditAmount: formatCurrencyFromCent(totals.creditAmount),
    creditBalance: formatCurrencyFromCent(totals.creditBalance),
    realCreditBalance: formatCurrencyFromCent(totals.realCreditBalance),
    tempCredit: formatCurrencyFromCent(totals.tempCredit),
    tempAmountInfoList: totals.tempAmountInfoList.map((item) => ({
      uin: item.Uin,
      tempAmount: formatCurrencyFromCent(item.TempAmount),
      startTime: item.StartTime,
      endTime: item.EndTime,
    })),
  };
}

async function loadAccountDashboard(account: CloudAccount): Promise<DashboardAccountData> {
  const balance = await getAccountBalanceResponse(account.id);

  return {
    balance,
  };
}

async function loadData(isManual = false) {
  const requestId = ++loadSequence;
  const targetAccounts = getTargetAccounts();

  if (targetAccounts.length === 0) {
    clearDashboardData();
    errorMessage.value = '';
    loading.value = accountsStore.loading;
    refreshing.value = false;
    return;
  }

  errorMessage.value = '';
  if (isManual) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }

  try {
    const [cvmResult, databaseResult, results] = await Promise.all([
      loadCloudDashboardRows().then((value) => ({ status: 'fulfilled' as const, value })).catch((reason) => ({
        status: 'rejected' as const,
        reason,
      })),
      loadDatabaseDashboardRows().then((value) => ({ status: 'fulfilled' as const, value })).catch((reason) => ({
        status: 'rejected' as const,
        reason,
      })),
      Promise.allSettled(targetAccounts.map((account) => loadAccountDashboard(account))),
    ]);

    if (requestId !== loadSequence) {
      return;
    }

    const successful = results.flatMap((result) => (
      result.status === 'fulfilled' ? [result.value] : []
    ));
    const failedAccounts = results.flatMap((result, index) => (
      result.status === 'rejected' ? [targetAccounts[index].name] : []
    ));

    cvmRows.value = cvmResult.status === 'fulfilled' ? cvmResult.value : [];
    databaseRows.value = databaseResult.status === 'fulfilled' ? databaseResult.value : [];
    loadedAccountCount.value = successful.length;

    if (cvmResult.status === 'rejected' && databaseResult.status === 'rejected' && successful.length === 0) {
      clearDashboardData();
      const baseErrors = [
        cvmResult.reason instanceof Error ? cvmResult.reason.message : '云服务器列表加载失败',
        databaseResult.reason instanceof Error ? databaseResult.reason.message : '数据库列表加载失败',
      ];
      if (failedAccounts.length > 0) {
        baseErrors.push(`账号数据加载失败：${failedAccounts.join('、')}`);
      }
      errorMessage.value = baseErrors.join('；');
      return;
    }

    const balanceResponses = successful.map((item) => item.balance);
    balanceSummary.value =
      !isAllAccountsView.value && balanceResponses.length === 1
        ? translateAccountBalance(balanceResponses[0])
        : mergeAccountBalances(balanceResponses);

    stats.value = buildDashboardStats(cvmRows.value, databaseRows.value);
    resetCvmFilters();
    resetDatabaseFilters();

    const errorMessages: string[] = [];

    if (cvmResult.status === 'rejected') {
      errorMessages.push(
        cvmResult.reason instanceof Error ? cvmResult.reason.message : '云服务器列表加载失败',
      );
    }
    if (databaseResult.status === 'rejected') {
      errorMessages.push(
        databaseResult.reason instanceof Error ? databaseResult.reason.message : '数据库列表加载失败',
      );
    }
    if (failedAccounts.length > 0) {
      errorMessages.push(`部分账号加载失败：${failedAccounts.join('、')}`);
    }

    if (errorMessages.length > 0) {
      errorMessage.value = errorMessages.join('；');
    }
  } catch (error) {
    if (requestId !== loadSequence) {
      return;
    }

    clearDashboardData();
    errorMessage.value = error instanceof Error ? error.message : '加载统计失败';
  } finally {
    if (requestId === loadSequence) {
      loading.value = false;
      refreshing.value = false;
    }
  }
}

watch(
  () => accountsStore.accountList.map((account) => account.id).join(','),
  () => {
    if (accountsStore.accountList.length === 0) {
      activeScope.value = ALL_ACCOUNTS_SCOPE;
      return;
    }

    if (
      activeScope.value !== ALL_ACCOUNTS_SCOPE &&
      !accountsStore.accountList.some((account) => account.id === activeScope.value)
    ) {
      activeScope.value = ALL_ACCOUNTS_SCOPE;
    }
  },
  { immediate: true },
);

watch(
  () => [accountsStore.loading, activeScope.value, accountsStore.accountList.map((account) => account.id).join(',')].join('|'),
  () => {
    void loadData(false);
  },
  { immediate: true },
);

watch([activeScope, cvmSearchKeyword, cvmStatusFilter], () => {
  cvmPage.value = 1;
});

watch([activeScope, databaseSearchKeyword, databaseStatusFilter, databaseTypeFilter], () => {
  databasePage.value = 1;
});

watch(cvmPageCount, (pageCount) => {
  if (cvmPage.value > pageCount) {
    cvmPage.value = pageCount;
  }
});

watch(databasePageCount, (pageCount) => {
  if (databasePage.value > pageCount) {
    databasePage.value = pageCount;
  }
});

watch(activeScope, (value) => {
  if (value !== ALL_ACCOUNTS_SCOPE && value !== accountsStore.currentAccountId) {
    accountsStore.selectAccount(value);
  }
});
</script>
