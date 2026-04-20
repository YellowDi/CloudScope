<template>
  <div class="grid gap-2.5">
    <Skeleton
      v-for="index in rows"
      :key="index"
      :class="[
        kind === 'text' ? 'h-3.5 w-full' : '',
        kind === 'card' ? 'h-10 w-full' : '',
        kind === 'table' ? 'h-4 w-full' : '',
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';

withDefaults(
  defineProps<{
    kind?: 'text' | 'card' | 'table';
    rows?: number;
  }>(),
  {
    kind: 'text',
    rows: 3,
  },
);
</script>
