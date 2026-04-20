<template>
  <TablePageTable
    :columns="normalizedColumns"
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
import { computed } from 'vue';
import type { TableColumn as TablePageColumn } from '@/components/table-page/types';
import type { TableColumn } from '@/services/types';
import TablePageTable from '@/components/table-page/TablePageTable.vue';

const props = withDefaults(
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

const normalizedColumns = computed<TablePageColumn[]>(() =>
  props.columns.map((column) => ({
    key: column.key,
    label: column.title,
    cellClass: column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : undefined,
  })),
);
</script>
