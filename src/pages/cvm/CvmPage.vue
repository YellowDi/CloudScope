<template>
  <section class="resource-page">
    <PageHeader eyebrow="CVM" title="云服务器实例" description="数据结构严格模拟腾讯云 DescribeInstances 响应，并在 services 层完成转译。">
      <template #actions>
        <BaseButton label="刷新列表" variant="secondary" :loading="refreshing" @click="loadData(true)" />
      </template>
    </PageHeader>

    <EmptyState
      v-if="showEmpty"
      title="暂无云账号"
      description="当前没有可用账号，无法查询云服务器。"
      action-label="前往账号管理"
      action-to="/accounts"
    />

    <template v-else>
      <p v-if="errorMessage" class="page-error">{{ errorMessage }}</p>
      <div class="resource-page__table-wrap">
        <TablePageTable :columns="columns" :rows="rows" row-key="id" :loading="loading">
          <template #cell-status="{ row }">
            <StatusTag :status="String(row.status)" />
          </template>
          <template #cell-createdAt="{ row }">
            {{ formatDateTime(String(row.createdAt)) }}
          </template>
          <template #empty>
            <EmptyState title="暂无 CVM 实例" description="当前账号下还没有可展示的云服务器数据。" />
          </template>
        </TablePageTable>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseButton from '@/components/BaseButton.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageHeader from '@/components/PageHeader.vue';
import StatusTag from '@/components/StatusTag.vue';
import TablePageTable from '@/components/table-page/TablePageTable.vue';
import { getCvmList } from '@/services/cvm';
import type { CvmListItem, TableColumn } from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { formatDateTime } from '@/utils/time';

const accountsStore = useAccountsStore();
const loading = ref(true);
const refreshing = ref(false);
const errorMessage = ref('');
const rows = ref<CvmListItem[]>([]);
const showEmpty = computed(() => !accountsStore.loading && !accountsStore.currentAccountId);

const columns: TableColumn[] = [
  { key: 'id', title: '实例 ID', width: '14rem' },
  { key: 'name', title: '名称', width: '12rem' },
  { key: 'status', title: '状态', width: '8rem' },
  { key: 'publicIp', title: '公网 IP', width: '10rem' },
  { key: 'privateIp', title: '私网 IP', width: '10rem' },
  { key: 'spec', title: '配置', width: '10rem' },
  { key: 'createdAt', title: '创建时间', width: '12rem' },
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
    rows.value = await getCvmList(accountsStore.currentAccountId);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载 CVM 列表失败';
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

<style scoped>
.resource-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  min-height: 0;
  flex: 1;
}

.resource-page__table-wrap {
  min-height: 0;
  flex: 1;
}

.page-error {
  margin: 0;
  color: var(--ds-color-accent-red);
}
</style>
