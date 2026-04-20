<template>
  <div class="overflow-hidden rounded-lg border bg-card shadow-sm">
    <ScrollArea class="h-full w-full">
      <div :style="{ minWidth }">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead
                v-for="column in columns"
                :key="column.key"
                class="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
                :style="{ width: column.width, textAlign: column.align ?? 'left' }"
              >
                {{ column.title }}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody v-if="loading">
            <TableRow v-for="index in loadingRows" :key="index">
              <TableCell v-for="column in columns" :key="column.key">
                <SkeletonLoader kind="table" :rows="1" />
              </TableCell>
            </TableRow>
          </TableBody>

          <TableBody v-else-if="data.length > 0">
            <TableRow v-for="row in data" :key="String(row[rowKey])" class="select-text">
              <TableCell v-for="column in columns" :key="column.key" :style="{ textAlign: column.align ?? 'left' }">
                <slot :name="`cell-${column.key}`" :row="row">
                  {{ column.render ? column.render(row) : row[column.key] }}
                </slot>
              </TableCell>
            </TableRow>
          </TableBody>

          <TableBody v-else>
            <TableEmpty :colspan="columns.length">
              <slot name="empty" />
            </TableEmpty>
          </TableBody>
        </Table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@/services/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SkeletonLoader from './SkeletonLoader.vue';

withDefaults(
  defineProps<{
    columns: TableColumn[];
    data: Record<string, unknown>[];
    rowKey: string;
    loading?: boolean;
    loadingRows?: number;
    minWidth?: string;
  }>(),
  {
    loading: false,
    loadingRows: 6,
    minWidth: '56rem',
  },
);
</script>
