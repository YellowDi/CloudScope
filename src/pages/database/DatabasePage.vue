<template>
  <section class="flex min-h-0 flex-1 flex-col gap-6">
    <EmptyState
      v-if="showEmpty"
      title="暂无云账号"
      description="当前没有可用账号，无法查询数据库资源。"
      action-label="前往账号管理"
      action-to="/accounts"
    />

    <template v-else>
      <Alert v-if="errorMessage" variant="destructive">
        <AlertTitle>加载失败</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <div class="flex justify-end">
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

      <TablePageTable :columns="columns" :rows="rows" row-key="id" :loading="loading" :show-index="true" :sticky-header="true" :edge-gutter="false">
        <template #cell-status="{ row }">
          <StatusTag :status="String(row.status)" />
        </template>
        <template #cell-createdAt="{ row }">
          {{ formatDateTime(String(row.createdAt)) }}
        </template>
        <template #empty>
          <EmptyState
            title="暂无数据库实例"
            description="当前账号下还没有可展示的数据库数据。"
          />
        </template>
      </TablePageTable>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';
import EmptyState from '@/components/EmptyState.vue';
import StatusTag from '@/components/StatusTag.vue';
import type { TableColumn } from '@/components/table-page/types';
import TablePageTable from '@/components/table-page/TablePageTable.vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getDatabaseList } from '@/services/database';
import type { DatabaseListItem } from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { formatDateTime } from '@/utils/time';

const accountsStore = useAccountsStore();
const loading = ref(true);
const refreshing = ref(false);
const errorMessage = ref('');
const rows = ref<DatabaseListItem[]>([]);
const showEmpty = computed(() => !accountsStore.loading && !accountsStore.currentAccountId);

const columns: TableColumn[] = [
  {
    key: 'id',
    label: '实例 ID',
    filterType: 'text',
  },
  {
    key: 'name',
    label: '名称',
    filterType: 'text',
  },
  {
    key: 'type',
    label: '类型',
    filterType: 'tag',
  },
  {
    key: 'status',
    label: '状态',
    filterType: 'tag',
  },
  {
    key: 'address',
    label: '地址',
    filterType: 'text',
  },
  {
    key: 'storage',
    label: '存储',
    filterType: 'text',
  },
  {
    key: 'createdAt',
    label: '创建时间',
    tone: 'muted',
  },
];

async function loadData(isManual = false) {
  if (!accountsStore.currentAccountId) {
    rows.value = [];
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
    rows.value = await getDatabaseList(accountsStore.currentAccountId);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载数据库列表失败';
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
