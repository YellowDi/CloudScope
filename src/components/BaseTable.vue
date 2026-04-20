<template>
  <TablePageTable
    :columns="columns"
    :rows="data"
    :row-key="rowKey"
    :loading="loading"
    :loading-row-count="loadingRows"
    :summary="summary"
    :wrapper-class="wrapperClass"
    :table-class="tableClass"
  >
    <template #empty>
      <slot name="empty" />
    </template>

    <template
      v-for="column in columns"
      :key="column.key"
      #[`cell-${column.key}`]="slotProps"
    >
      <slot :name="`cell-${column.key}`" v-bind="slotProps">
        {{ slotProps.value }}
      </slot>
    </template>
  </TablePageTable>
</template>

<script setup lang="ts">
import type { TableColumn } from '@/services/types';
import TablePageTable from '@/components/table-page/TablePageTable.vue';

withDefaults(
  defineProps<{
    columns: TableColumn[];
    data: Record<string, unknown>[];
    rowKey: string | ((row: Record<string, unknown>, index: number) => string | number);
    loading?: boolean;
    loadingRows?: number;
    summary?: string;
    wrapperClass?: string;
    tableClass?: string;
  }>(),
  {
    loading: false,
    loadingRows: 8,
    summary: '',
    wrapperClass: '',
    tableClass: '',
  },
);
</script>
