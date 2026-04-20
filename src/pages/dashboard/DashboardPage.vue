<template>
  <section class="flex flex-1 flex-col gap-6">
    <PageHeader eyebrow="Dashboard" title="资源总览" description="统计当前云账号下的 CVM 与 TencentDB 资源状态。">
      <template #actions>
        <AccountSwitcher />
        <BaseButton label="刷新数据" variant="secondary" :loading="refreshing" @click="loadData(true)" />
      </template>
    </PageHeader>

    <EmptyState
      v-if="showEmpty"
      title="暂无云账号"
      description="请先创建并选择一个云账号，再查看资源概览。"
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
          :meta="balanceSummary ? `账户 UIN ${balanceSummary.uin}` : '获取账户余额（Balance / RealBalance）'"
          :loading="loading"
        />
        <StatCard
          label="现金账户余额"
          :value="balanceSummary?.cashBalance ?? '--'"
          :meta="balanceSummary ? `收益转入 ${balanceSummary.incomeBalance} / 赠送余额 ${balanceSummary.presentBalance}` : 'CashAccountBalance'"
          :loading="loading"
        />
        <StatCard
          label="可用信用额度"
          :value="balanceSummary?.creditBalance ?? '--'"
          :meta="balanceSummary ? `信用总额 ${balanceSummary.creditAmount} / 真实可用 ${balanceSummary.realCreditBalance}` : 'CreditBalance / RealCreditBalance'"
          :loading="loading"
        />
        <StatCard
          label="欠费金额"
          :value="balanceSummary?.oweAmount ?? '--'"
          :meta="balanceSummary ? `冻结金额 ${balanceSummary.freezeAmount} / 临时额度 ${balanceSummary.tempCredit}` : 'OweAmount / FreezeAmount / TempCredit'"
          :loading="loading"
        />
      </div>

      <div class="flex min-h-0 flex-1 flex-col gap-4">
        <Tabs v-model="activeTab" class="flex min-h-0 flex-1 flex-col gap-4">
          <div class="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-between">
            <TabsList class="h-9 w-fit shrink-0 gap-1.5 rounded-full bg-transparent p-0">
              <TabsTrigger
                value="cvm"
                class="h-9 rounded-full pl-4 pr-2 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground data-[state=active]:bg-[oklch(96.6%_0.005_106.5)] data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-muted"
              >
                云服务器
                <span
                  :class="activeTab === 'cvm' ? 'bg-foreground text-background' : 'bg-muted text-foreground/55'"
                  class="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-none transition-colors"
                >
                  {{ formatCount(cvmRows.length) }}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="database"
                class="h-9 rounded-full pl-4 pr-2 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground data-[state=active]:bg-[oklch(96.6%_0.005_106.5)] data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-muted"
              >
                数据库
                <span
                  :class="activeTab === 'database' ? 'bg-foreground text-background' : 'bg-muted text-foreground/55'"
                  class="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-none transition-colors"
                >
                  {{ formatCount(databaseRows.length) }}
                </span>
              </TabsTrigger>
            </TabsList>

            <div v-if="activeTab === 'cvm'" class="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Input
                v-model="cvmSearchKeyword"
                class="h-9 min-w-0 flex-1"
                placeholder="搜索实例 ID、名称、IP、配置"
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
                placeholder="搜索实例 ID、名称、类型、地址"
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
              <BaseTable :columns="cvmColumns" :data="filteredCvmRows" row-key="id" :loading="loading">
                <template #cell-status="{ row }">
                  <StatusTag :status="String(row.status)" />
                </template>
                <template #cell-createdAt="{ row }">
                  {{ formatDateTime(String(row.createdAt)) }}
                </template>
                <template #empty>
                  <EmptyState
                    :title="hasCvmFilters ? '没有匹配的 CVM 实例' : '暂无 CVM 实例'"
                    :description="hasCvmFilters ? '请调整搜索关键词或状态筛选条件。' : '当前账号下还没有可展示的云服务器数据。'"
                  />
                </template>
              </BaseTable>
            </div>
          </TabsContent>

          <TabsContent value="database" class="mt-0 min-h-0 flex-1">
            <div class="flex min-h-0 flex-1 flex-col">
              <BaseTable :columns="databaseColumns" :data="filteredDatabaseRows" row-key="id" :loading="loading">
                <template #cell-status="{ row }">
                  <StatusTag :status="String(row.status)" />
                </template>
                <template #cell-createdAt="{ row }">
                  {{ formatDateTime(String(row.createdAt)) }}
                </template>
                <template #empty>
                  <EmptyState
                    :title="hasDatabaseFilters ? '没有匹配的数据库实例' : '暂无数据库实例'"
                    :description="hasDatabaseFilters ? '请调整搜索关键词、状态或类型筛选条件。' : '当前账号下还没有可展示的数据库数据。'"
                  />
                </template>
              </BaseTable>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AccountSwitcher from '@/components/AccountSwitcher.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseTable from '@/components/BaseTable.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageHeader from '@/components/PageHeader.vue';
import StatCard from '@/components/StatCard.vue';
import StatusTag from '@/components/StatusTag.vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAccountBalance } from '@/services/billing';
import { getCvmList } from '@/services/cvm';
import { getDatabaseList } from '@/services/database';
import { buildDashboardStats } from '@/services/translators';
import type {
  AccountBalanceSummary,
  CvmListItem,
  DashboardStats,
  DatabaseListItem,
  TableColumn,
} from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { formatCount } from '@/utils/format';
import { formatDateTime } from '@/utils/time';

const accountsStore = useAccountsStore();
const stats = ref<DashboardStats | null>(null);
const balanceSummary = ref<AccountBalanceSummary | null>(null);
const cvmRows = ref<CvmListItem[]>([]);
const databaseRows = ref<DatabaseListItem[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const errorMessage = ref('');
const showEmpty = computed(() => !accountsStore.loading && !accountsStore.currentAccountId);
const activeTab = ref<'cvm' | 'database'>('cvm');
const showBalanceCards = ref(false);
const cvmSearchKeyword = ref('');
const cvmStatusFilter = ref('all');
const databaseSearchKeyword = ref('');
const databaseStatusFilter = ref('all');
const databaseTypeFilter = ref('all');

const cvmColumns: TableColumn[] = [
  { key: 'id', title: '实例 ID', width: '14rem' },
  { key: 'name', title: '名称', width: '12rem' },
  { key: 'status', title: '状态', width: '8rem' },
  { key: 'publicIp', title: '公网 IP', width: '10rem' },
  { key: 'privateIp', title: '私网 IP', width: '10rem' },
  { key: 'spec', title: '配置', width: '10rem' },
  { key: 'createdAt', title: '创建时间', width: '12rem' },
];

const cvmStatusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已停止', value: 'STOPPED' },
  { label: '启动中', value: 'PENDING' },
];

const databaseStatusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '运行中', value: 'RUNNING' },
  { label: '创建中', value: 'PENDING' },
  { label: '隔离中', value: 'ISOLATED' },
];

const databaseTypeOptions = computed(() => {
  const values = Array.from(new Set(databaseRows.value.map((item) => item.type)));
  return [
    { label: '全部类型', value: 'all' },
    ...values.map((value) => ({ label: value, value })),
  ];
});

const filteredCvmRows = computed(() => {
  const keyword = cvmSearchKeyword.value.trim().toLowerCase();

  return cvmRows.value.filter((row) => {
    const matchesKeyword =
      keyword.length === 0 ||
      [row.id, row.name, row.publicIp, row.privateIp, row.spec]
        .some((value) => value.toLowerCase().includes(keyword));

    const matchesStatus =
      cvmStatusFilter.value === 'all' || row.statusCode === cvmStatusFilter.value;

    return matchesKeyword && matchesStatus;
  });
});

const filteredDatabaseRows = computed(() => {
  const keyword = databaseSearchKeyword.value.trim().toLowerCase();

  return databaseRows.value.filter((row) => {
    const matchesKeyword =
      keyword.length === 0 ||
      [row.id, row.name, row.type, row.address]
        .some((value) => value.toLowerCase().includes(keyword));

    const matchesStatus =
      databaseStatusFilter.value === 'all' || row.statusCode === databaseStatusFilter.value;

    const matchesType =
      databaseTypeFilter.value === 'all' || row.type === databaseTypeFilter.value;

    return matchesKeyword && matchesStatus && matchesType;
  });
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

function resetCvmFilters() {
  cvmSearchKeyword.value = '';
  cvmStatusFilter.value = 'all';
}

function resetDatabaseFilters() {
  databaseSearchKeyword.value = '';
  databaseStatusFilter.value = 'all';
  databaseTypeFilter.value = 'all';
}

const databaseColumns: TableColumn[] = [
  { key: 'id', title: '实例 ID', width: '14rem' },
  { key: 'name', title: '名称', width: '12rem' },
  { key: 'type', title: '类型', width: '8rem' },
  { key: 'status', title: '状态', width: '8rem' },
  { key: 'address', title: '地址', width: '12rem' },
  { key: 'storage', title: '存储', width: '8rem' },
  { key: 'createdAt', title: '创建时间', width: '12rem' },
];

async function loadData(isManual = false) {
  if (!accountsStore.currentAccountId) {
    stats.value = null;
    balanceSummary.value = null;
    cvmRows.value = [];
    databaseRows.value = [];
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
    const [cvmList, databaseList, balance] = await Promise.all([
      getCvmList(accountsStore.currentAccountId),
      getDatabaseList(accountsStore.currentAccountId),
      getAccountBalance(accountsStore.currentAccountId),
    ]);
    cvmRows.value = cvmList;
    databaseRows.value = databaseList;
    balanceSummary.value = balance;
    resetCvmFilters();
    resetDatabaseFilters();
    stats.value = buildDashboardStats(cvmList, databaseList);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载统计失败';
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

watch(
  () => accountsStore.currentAccountId,
  () => {
    void loadData(false);
  },
  { immediate: true },
);
</script>
