<template>
  <div :class="getTableWrapperClass(wrapperClass)">
    <div v-if="!showEmptyState" :class="tableTheme.scrollViewport">
      <div :class="tableTheme.scrollContent">
        <table :class="getTableClass(tableClass)">
          <colgroup>
            <col v-if="showIndex" style="width: 4.5rem" />
            <col
              v-for="column in columns"
              :key="`col-${column.key}`"
              :style="column.width ? { width: column.width } : undefined"
            />
          </colgroup>

          <thead :class="[tableTheme.head, tableTheme.headActive]">
            <tr>
              <th v-if="showIndex" :class="tableTheme.headerCell.base">序号</th>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[tableTheme.headerCell.base, getHeaderAlignmentClass(column)]"
              >
                {{ column.title }}
              </th>
            </tr>
          </thead>

          <tbody :class="tableTheme.body">
            <template v-if="showLoadingRows">
              <tr
                v-for="rowIndex in loadingRowCount"
                :key="`loading-row-${rowIndex}`"
                :class="tableTheme.row"
                aria-hidden="true"
              >
                <td v-if="showIndex" :class="tableTheme.bodyCell.base">
                  <Skeleton class="h-4 w-6 rounded-sm bg-muted" />
                </td>
                <td
                  v-for="column in columns"
                  :key="`loading-row-${rowIndex}-cell-${column.key}`"
                  :class="[tableTheme.bodyCell.base, getBodyAlignmentClass(column)]"
                >
                  <Skeleton :class="getLoadingLineClass(rowIndex, column.key)" />
                </td>
              </tr>
            </template>

            <tr
              v-else-if="hasRows"
              v-for="(row, index) in rows"
              :key="getResolvedRowKey(row, index)"
              :class="tableTheme.row"
            >
              <td v-if="showIndex" :class="[tableTheme.bodyCell.base, tableTheme.bodyCell.numeric]">
                {{ index + 1 }}
              </td>
              <td
                v-for="column in columns"
                :key="column.key"
                :class="[tableTheme.bodyCell.base, getBodyAlignmentClass(column)]"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :value="getColumnValue(row, column)"
                  :index="index"
                >
                  {{ getColumnValue(row, column) }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else :class="tableTheme.empty">
      <slot name="empty">
        <div class="grid max-w-md gap-2 text-center">
          <p class="text-lg font-semibold tracking-tight text-foreground">暂无数据</p>
          <p class="text-sm text-muted-foreground">当前列表还没有可展示的数据。</p>
        </div>
      </slot>
    </div>

    <div v-if="summary" :class="tableTheme.summary">
      {{ summary }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Skeleton } from '@/components/ui/skeleton';
import type { TableColumn } from '@/services/types';
import { getTableClass, getTableWrapperClass, tableTheme } from './tableTheme';

const props = withDefaults(
  defineProps<{
    columns: TableColumn[];
    rows: Record<string, unknown>[];
    rowKey: string | ((row: Record<string, unknown>, index: number) => string | number);
    loading?: boolean;
    loadingRowCount?: number;
    showIndex?: boolean;
    summary?: string;
    wrapperClass?: string;
    tableClass?: string;
  }>(),
  {
    loading: false,
    loadingRowCount: 8,
    showIndex: false,
    summary: '',
    wrapperClass: '',
    tableClass: '',
  },
);
const showLoadingRows = computed(() => props.loading && props.rows.length === 0);
const hasRows = computed(() => props.rows.length > 0);
const showEmptyState = computed(() => !props.loading && props.rows.length === 0);

function getResolvedRowKey(row: Record<string, unknown>, index: number) {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row, index);
  }

  const value = row[props.rowKey];
  return typeof value === 'string' || typeof value === 'number' ? value : index;
}

function getColumnValue(row: Record<string, unknown>, column: TableColumn) {
  if (column.render) {
    return column.render(row);
  }

  return row[column.key] ?? '--';
}

function getHeaderAlignmentClass(column: TableColumn) {
  if (column.align === 'center') {
    return 'text-center';
  }

  if (column.align === 'right') {
    return 'text-right';
  }

  return 'text-left';
}

function getBodyAlignmentClass(column: TableColumn) {
  if (column.align === 'center') {
    return 'text-center';
  }

  if (column.align === 'right') {
    return tableTheme.bodyCell.numeric;
  }

  return 'text-left';
}

function getLoadingLineClass(rowIndex: number, columnKey: string) {
  const seed = (rowIndex + columnKey.length) % 4;
  const widths = ['w-16', 'w-20', 'w-24', 'w-32'];
  return [tableTheme.loadingLine, widths[seed]];
}
</script>
