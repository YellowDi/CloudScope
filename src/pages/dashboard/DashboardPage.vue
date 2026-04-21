<template>
  <section class="-mt-8 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
    <header
      class="sticky z-10 flex flex-col gap-4 bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      :style="{ top: 'var(--table-page-sticky-top)' }"
    >
      <div class="flex flex-col gap-1.5 lg:flex-row lg:flex-nowrap lg:items-baseline lg:gap-2">
        <h1 class="shrink-0 leading-none font-semibold tracking-tight text-foreground text-[24px] sm:text-[28px] xl:text-[32px]">
            资源总览
        </h1>
        <p class="max-w-3xl text-[18px] leading-none font-normal text-muted-foreground lg:min-w-0 lg:flex-1 lg:max-w-none lg:overflow-hidden lg:text-ellipsis lg:whitespace-nowrap lg:text-[17px] xl:text-[18px]">
          支持查看全部账号聚合数据，也可切换到单个账号查看 CVM、TencentDB 与域名资源状态。
        </p>
      </div>

      <div
        v-if="!showEmpty"
        class="flex min-w-0 items-end gap-2 border-b border-border"
      >
        <div class="relative min-w-0 flex-1 overflow-visible pt-1">
          <div
            ref="accountTabsScrollViewportRef"
            data-page-header-tabs-scroll
            class="min-w-0 -mt-1 overflow-x-auto whitespace-nowrap pt-1"
            @scroll="handleAccountTabsScroll"
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

          <div
            v-if="accountTabsOverflowLeft"
            class="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background via-background/88 to-transparent"
          />
          <div
            v-if="accountTabsOverflowRight"
            class="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background via-background/92 to-transparent"
          />
        </div>

        <div class="ml-auto flex shrink-0 items-center justify-end gap-1 pb-2 sm:gap-2">
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

      <div class="grid grid-cols-2 gap-2 md:gap-2.5 xl:grid-cols-6">
        <StatCard label="CVM 总数" :value="formatCount(stats.cvmTotal)" meta="腾讯云云服务器实例" :loading="summaryCardsLoading" />
        <StatCard label="数据库总数" :value="formatCount(stats.databaseTotal)" meta="TencentDB 实例" :loading="summaryCardsLoading" />
        <StatCard label="域名总数" :value="formatCount(stats.domainTotal)" meta="已添加域名看板实例" :loading="summaryCardsLoading" />
        <StatCard label="运行中实例数" :value="formatCount(stats.runningCount)" meta="跨资源聚合统计" :loading="summaryCardsLoading" />
        <StatCard label="异常实例数" :value="formatCount(stats.abnormalCount)" meta="所有非运行态实例" :loading="summaryCardsLoading" />
        <StatCard label="即将到期实例" :value="formatCount(stats.expiringSoonCount)" meta="含已过期与 30 天内到期实例" :loading="summaryCardsLoading" />
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
              <Button variant="outline" class="h-9 shrink-0 px-3 text-sm" @click="resetCvmFilters">清空筛选</Button>
            </div>

            <div v-else-if="activeResourceTab === 'database'" class="flex min-w-0 items-center gap-1.5 sm:gap-2">
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
              <Button variant="outline" class="h-9 shrink-0 px-3 text-sm" @click="resetDatabaseFilters">清空筛选</Button>
            </div>

            <div v-else class="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Input
                v-model="domainSearchKeyword"
                class="h-9 min-w-0 flex-1"
                placeholder="搜索域名、域名 ID、账号、后缀"
              />
              <div class="w-[6.5rem] shrink-0 sm:w-36">
                <BaseSelect
                  v-model="domainStatusFilter"
                  :options="domainStatusOptions"
                />
              </div>
              <div class="w-[6.5rem] shrink-0 sm:w-32">
                <BaseSelect
                  v-model="domainAutoRenewFilter"
                  :options="domainAutoRenewOptions"
                />
              </div>
              <Button variant="outline" class="h-9 shrink-0 px-3 text-sm" @click="resetDomainFilters">清空筛选</Button>
            </div>
          </div>

          <TabsContent value="cvm" class="mt-0 min-h-0 flex-1">
            <div class="flex min-h-0 flex-1 flex-col">
              <TablePageTable
                :columns="visibleCvmColumns"
                :rows="paginatedCvmRows"
                row-key="rowId"
                :loading="cvmLoading"
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
                :loading="databaseLoading"
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

          <TabsContent value="domain" class="mt-0 min-h-0 flex-1">
            <div class="flex min-h-0 flex-1 flex-col">
              <TablePageTable
                :columns="visibleDomainColumns"
                :rows="paginatedDomainRows"
                row-key="rowId"
                :loading="domainLoading"
                :show-index="true"
                :sticky-header="true"
                :edge-gutter="true"
                :list-level-table="false"
                :summary="domainTableSummary"
              >
                <template #cell-buyStatus="{ row }">
                  <span class="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    {{ row.buyStatus }}
                  </span>
                </template>
                <template #cell-autoRenew="{ row }">
                  <span class="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    {{ row.autoRenew }}
                  </span>
                </template>
                <template #cell-expirationDate="{ row }">
                  <div class="inline-flex w-max items-center gap-2 py-1 whitespace-nowrap">
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
                <template #cell-creationDate="{ row }">
                  <span>{{ formatDateTimeWithMinutes(String(row.creationDate)) }}</span>
                </template>
                <template #empty>
                  <EmptyState
                    :title="hasDomainFilters ? '没有匹配的域名' : '暂无域名'"
                    :description="hasDomainFilters ? '请调整搜索关键词、购买状态或自动续费筛选条件。' : domainEmptyDescription"
                  />
                </template>
              </TablePageTable>

              <div v-if="domainPageCount > 1" class="min-w-0 shrink-0 pt-3">
                <Pagination
                  v-model:page="domainPage"
                  :items-per-page="DASHBOARD_PAGE_SIZE"
                  :total="filteredDomainRows.length"
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
                        :is-active="item.value === domainPage"
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
import { useHorizontalOverflowMask } from '@/composables/useHorizontalOverflowMask';
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
import { getCloudDashboardList } from '@/services/cloud-dashboard';
import { getDatabaseDashboardList } from '@/services/database-dashboard';
import { getDomainDashboardList } from '@/services/domain-dashboard';
import { buildDashboardStats } from '@/services/translators';
import type { TableColumn } from '@/components/table-page/types';
import type {
  CloudDashboardInstanceItem,
  DashboardStats,
  DomainDashboardInstanceItem,
  DatabaseDashboardInstanceItem,
} from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { formatCount } from '@/utils/format';
import { formatDateTimeWithMinutes } from '@/utils/time';

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
const cvmRows = ref<CloudDashboardInstanceItem[]>([]);
const databaseRows = ref<DatabaseDashboardInstanceItem[]>([]);
const domainRows = ref<DomainDashboardInstanceItem[]>([]);
const cvmLoading = ref(true);
const databaseLoading = ref(true);
const domainLoading = ref(true);
const summaryCardsLoading = ref(true);
const refreshing = ref(false);
const cvmErrorMessage = ref('');
const databaseErrorMessage = ref('');
const domainErrorMessage = ref('');
const showEmpty = computed(() => !accountsStore.loading && accountsStore.accountList.length === 0);
const activeScope = ref(ALL_ACCOUNTS_SCOPE);
const activeResourceTab = ref<'cvm' | 'database' | 'domain'>('cvm');
const cvmSearchKeyword = ref('');
const cvmStatusFilter = ref('all');
const databaseSearchKeyword = ref('');
const databaseStatusFilter = ref('all');
const databaseTypeFilter = ref('all');
const domainSearchKeyword = ref('');
const domainStatusFilter = ref('all');
const domainAutoRenewFilter = ref('all');
const cvmPage = ref(1);
const databasePage = ref(1);
const domainPage = ref(1);

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

const domainColumns: TableColumn[] = [
  { key: 'account', label: '云账号', filterType: 'text', tone: 'muted' },
  { key: 'domainName', label: '域名' },
  { key: 'domainId', label: '域名 ID', tone: 'muted' },
  { key: 'expirationDate', label: '到期时间', tone: 'muted', headerClass: '!w-auto', cellClass: '!w-auto' },
  { key: 'buyStatus', label: '购买状态' },
  { key: 'autoRenew', label: '自动续费' },
  { key: 'tld', label: '后缀' },
  { key: 'codeTld', label: '编码后后缀', tone: 'muted' },
  { key: 'isPremium', label: '溢价域名' },
  { key: 'creationDate', label: '注册时间', tone: 'muted' },
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
const {
  scrollViewportRef: accountTabsScrollViewportRef,
  overflowLeft: accountTabsOverflowLeft,
  overflowRight: accountTabsOverflowRight,
  handleScroll: handleAccountTabsScroll,
} = useHorizontalOverflowMask({
  watchSource: computed(() => accountScopeTabs.value.map((tab) => `${tab.value}:${tab.label}`)),
});
const resourceSwitchTabs = computed(() => [
  { id: 'cvm', label: '云服务器', badge: formatCount(cvmRows.value.length) },
  { id: 'database', label: '数据库', badge: formatCount(databaseRows.value.length) },
  { id: 'domain', label: '域名', badge: formatCount(domainRows.value.length) },
]);
const stats = computed<DashboardStats>(() => buildDashboardStats(cvmRows.value, databaseRows.value, domainRows.value));
const errorMessage = computed(() =>
  [cvmErrorMessage.value, databaseErrorMessage.value, domainErrorMessage.value]
    .filter(Boolean)
    .join('；'),
);
const visibleCvmColumns = computed<TableColumn[]>(() =>
  isAllAccountsView.value ? cvmColumns : cvmColumns.filter((column) => column.key !== 'account'),
);

const visibleDatabaseColumns = computed<TableColumn[]>(() =>
  isAllAccountsView.value ? databaseColumns : databaseColumns.filter((column) => column.key !== 'account'),
);

const visibleDomainColumns = computed<TableColumn[]>(() =>
  isAllAccountsView.value ? domainColumns : domainColumns.filter((column) => column.key !== 'account'),
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

const domainStatusOptions = computed(() => {
  const values = Array.from(new Set(domainRows.value.map((item) => item.buyStatus).filter(Boolean)));
  return [
    { label: '全部状态', value: 'all' },
    ...values.map((value) => ({ label: value, value })),
  ];
});

const domainAutoRenewOptions = computed(() => {
  const entries = Array.from(new Map(
    domainRows.value.map((item) => [item.autoRenewCode, item.autoRenew] as const).filter(([value]) => value),
  ).entries());

  return [
    { label: '全部续费', value: 'all' },
    ...entries.map(([value, label]) => ({ label, value })),
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

const domainDisplayRows = computed(() =>
  domainRows.value.map((row) => ({
    ...row,
    expirationInfo: buildExpirationInfo('', row.expirationDate),
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

const filteredDomainRows = computed(() => {
  const keyword = domainSearchKeyword.value.trim().toLowerCase();

  return domainDisplayRows.value.filter((row) => {
    const matchesKeyword =
      keyword.length === 0 ||
      [
        row.domainName,
        row.domainId,
        row.account,
        row.tld,
        row.codeTld,
        row.buyStatus,
        row.autoRenew,
        row.isPremium,
        row.creationDate,
        row.expirationDate,
        row.expirationInfo.dateText,
        row.expirationInfo.relativeText,
      ]
        .some((value) => value.toLowerCase().includes(keyword));

    const matchesStatus =
      domainStatusFilter.value === 'all' || row.buyStatus === domainStatusFilter.value;

    const matchesAutoRenew =
      domainAutoRenewFilter.value === 'all' || row.autoRenewCode === domainAutoRenewFilter.value;

    return matchesKeyword && matchesStatus && matchesAutoRenew;
  });
});

const cvmPageCount = computed(() => Math.max(1, Math.ceil(filteredCvmRows.value.length / DASHBOARD_PAGE_SIZE)));
const databasePageCount = computed(() => Math.max(1, Math.ceil(filteredDatabaseRows.value.length / DASHBOARD_PAGE_SIZE)));
const domainPageCount = computed(() => Math.max(1, Math.ceil(filteredDomainRows.value.length / DASHBOARD_PAGE_SIZE)));

const paginatedCvmRows = computed(() => {
  const start = (cvmPage.value - 1) * DASHBOARD_PAGE_SIZE;
  return filteredCvmRows.value.slice(start, start + DASHBOARD_PAGE_SIZE);
});

const paginatedDatabaseRows = computed(() => {
  const start = (databasePage.value - 1) * DASHBOARD_PAGE_SIZE;
  return filteredDatabaseRows.value.slice(start, start + DASHBOARD_PAGE_SIZE);
});

const paginatedDomainRows = computed(() => {
  const start = (domainPage.value - 1) * DASHBOARD_PAGE_SIZE;
  return filteredDomainRows.value.slice(start, start + DASHBOARD_PAGE_SIZE);
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

const hasDomainFilters = computed(
  () =>
    domainSearchKeyword.value.trim().length > 0 ||
    domainStatusFilter.value !== 'all' ||
    domainAutoRenewFilter.value !== 'all',
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

const domainEmptyDescription = computed(() =>
  isAllAccountsView.value
    ? '全部账号下还没有可展示的域名数据。'
    : '当前账号下还没有可展示的域名数据。',
);

const cvmTableSummary = computed(() => buildPageSummary(cvmPage.value, filteredCvmRows.value.length));
const databaseTableSummary = computed(() => buildPageSummary(databasePage.value, filteredDatabaseRows.value.length));
const domainTableSummary = computed(() => buildPageSummary(domainPage.value, filteredDomainRows.value.length));

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

function resetDomainFilters() {
  domainSearchKeyword.value = '';
  domainStatusFilter.value = 'all';
  domainAutoRenewFilter.value = 'all';
}

function handleSelectScope(value: string) {
  activeScope.value = value;
}

function handleResourceTabChange(value: string) {
  if (value === 'cvm' || value === 'database' || value === 'domain') {
    activeResourceTab.value = value;
  }
}

function clearDashboardData() {
  cvmRows.value = [];
  databaseRows.value = [];
  domainRows.value = [];
}

function clearSectionErrors() {
  cvmErrorMessage.value = '';
  databaseErrorMessage.value = '';
  domainErrorMessage.value = '';
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

async function loadDomainDashboardRows(): Promise<DomainDashboardInstanceItem[]> {
  const scopedAccount = isAllAccountsView.value
    ? null
    : accountsStore.accountList.find((account) => account.id === activeScope.value) ?? null;
  const { list } = await getDomainDashboardList({
    AccountName: scopedAccount?.name,
    AccountUUID: scopedAccount?.uuid ?? scopedAccount?.id,
    Full: true,
  });

  return list;
}

async function loadCvmSection(requestId: number, preserveExistingData: boolean) {
  try {
    const rows = await loadCloudDashboardRows();
    if (requestId !== loadSequence) {
      return;
    }

    cvmRows.value = rows;
  } catch (error) {
    if (requestId !== loadSequence) {
      return;
    }

    if (!preserveExistingData) {
      cvmRows.value = [];
    }

    const message = error instanceof Error ? error.message : '加载失败';
    cvmErrorMessage.value = `云服务器列表加载失败：${message}`;
  } finally {
    if (requestId === loadSequence) {
      cvmLoading.value = false;
    }
  }
}

async function loadDatabaseSection(requestId: number, preserveExistingData: boolean) {
  try {
    const rows = await loadDatabaseDashboardRows();
    if (requestId !== loadSequence) {
      return;
    }

    databaseRows.value = rows;
  } catch (error) {
    if (requestId !== loadSequence) {
      return;
    }

    if (!preserveExistingData) {
      databaseRows.value = [];
    }

    const message = error instanceof Error ? error.message : '加载失败';
    databaseErrorMessage.value = `数据库列表加载失败：${message}`;
  } finally {
    if (requestId === loadSequence) {
      databaseLoading.value = false;
    }
  }
}

async function loadDomainSection(requestId: number, preserveExistingData: boolean) {
  try {
    const rows = await loadDomainDashboardRows();
    if (requestId !== loadSequence) {
      return;
    }

    domainRows.value = rows;
  } catch (error) {
    if (requestId !== loadSequence) {
      return;
    }

    if (!preserveExistingData) {
      domainRows.value = [];
    }

    const message = error instanceof Error ? error.message : '加载失败';
    domainErrorMessage.value = `域名列表加载失败：${message}`;
  } finally {
    if (requestId === loadSequence) {
      domainLoading.value = false;
    }
  }
}

async function loadData(isManual = false) {
  const requestId = ++loadSequence;
  const preserveExistingData = isManual;

  if (accountsStore.accountList.length === 0) {
    clearDashboardData();
    clearSectionErrors();
    cvmLoading.value = accountsStore.loading;
    databaseLoading.value = accountsStore.loading;
    domainLoading.value = accountsStore.loading;
    summaryCardsLoading.value = accountsStore.loading;
    refreshing.value = false;
    return;
  }

  clearSectionErrors();
  if (isManual) {
    refreshing.value = true;
  } else {
    clearDashboardData();
    resetCvmFilters();
    resetDatabaseFilters();
    resetDomainFilters();
    cvmLoading.value = true;
    databaseLoading.value = true;
    domainLoading.value = true;
    summaryCardsLoading.value = true;
  }

  await Promise.allSettled([
    loadCvmSection(requestId, preserveExistingData),
    loadDatabaseSection(requestId, preserveExistingData),
    loadDomainSection(requestId, preserveExistingData),
  ]);

  if (requestId !== loadSequence) {
    return;
  }

  if (requestId === loadSequence) {
    summaryCardsLoading.value = false;
    refreshing.value = false;
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

watch([activeScope, domainSearchKeyword, domainStatusFilter, domainAutoRenewFilter], () => {
  domainPage.value = 1;
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

watch(domainPageCount, (pageCount) => {
  if (domainPage.value > pageCount) {
    domainPage.value = pageCount;
  }
});

watch(activeScope, (value) => {
  if (value !== ALL_ACCOUNTS_SCOPE && value !== accountsStore.currentAccountId) {
    accountsStore.selectAccount(value);
  }
});
</script>
