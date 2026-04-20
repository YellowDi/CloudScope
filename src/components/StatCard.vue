<template>
  <Card class="border-border bg-muted shadow-sm">
    <CardContent class="flex min-w-0 flex-col gap-2 p-3">
      <p class="truncate whitespace-nowrap text-xs text-muted-foreground">{{ label }}</p>
      <SkeletonLoader v-if="loading" kind="text" :rows="2" />
      <template v-else>
        <h3 class="truncate whitespace-nowrap text-2xl font-semibold tracking-tight text-foreground">{{ value }}</h3>
        <p class="truncate whitespace-nowrap text-xs text-muted-foreground">{{ meta }}</p>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';
import SkeletonLoader from './SkeletonLoader.vue';

withDefaults(
  defineProps<{
    label: string;
    value: string;
    meta?: string;
    loading?: boolean;
  }>(),
  {
    meta: '',
    loading: false,
  },
);
</script>
