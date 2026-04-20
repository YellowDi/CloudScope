<template>
  <section class="resource-page">
    <PageHeader eyebrow="TencentDB" title="数据库实例" description="所有页面只消费转译后的 UI 模型，不直接依赖原始腾讯云字段。">
      <template #actions>
        <BaseButton label="刷新列表" variant="secondary" :loading="refreshing" @click="loadData(true)" />
      </template>
    </PageHeader>

    <EmptyState
      v-if="showEmpty"
      title="暂无云账号"
      description="当前没有可用账号，无法查询数据库资源。"
      action-label="前往账号管理"
      action-to="/accounts"
    />

    <template v-else>
      <p v-if="errorMessage" class="page-error">{{ errorMessage }}</p>
      <div class="resource-page__table-wrap">
        <BaseTable :columns="columns" :data="rows" row-key="id" :loading="loading">
          <template #cell-status="{ row }">
            <StatusTag :status="String(row.status)" />
          </template>
          <template #cell-createdAt="{ row }">
            {{ formatDateTime(String(row.createdAt)) }}
          </template>
          <template #empty>
            <EmptyState title="暂无数据库实例" description="当前账号下还没有可展示的数据库数据。" />
          </template>
        </BaseTable>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseTable from '@/components/BaseTable.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageHeader from '@/components/PageHeader.vue';
import StatusTag from '@/components/StatusTag.vue';
import { getDatabaseList } from '@/services/database';
import type { DatabaseListItem, TableColumn } from '@/services/types';
import { useAccountsStore } from '@/store/accounts';
import { formatDateTime } from '@/utils/time';

const accountsStore = useAccountsStore();
const loading = ref(true);
const refreshing = ref(false);
const errorMessage = ref('');
const rows = ref<DatabaseListItem[]>([]);
const showEmpty = computed(() => !accountsStore.loading && !accountsStore.currentAccountId);

const columns: TableColumn[] = [
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
