<template>
  <Card class="border-border bg-muted shadow-none">
    <CardContent class="flex min-w-0 flex-col gap-1.5 p-2.5 sm:p-3">
      <p class="truncate whitespace-nowrap text-[11px] leading-4 text-muted-foreground">{{ label }}</p>
      <div v-if="loading" class="grid gap-1.5">
        <Skeleton class="h-6 w-20 rounded-md sm:h-7 sm:w-24" />
        <Skeleton class="hidden h-3 w-32 rounded-md sm:block" />
      </div>
      <template v-else>
        <h3 class="truncate whitespace-nowrap text-[22px] leading-none font-semibold tracking-tight text-foreground sm:text-2xl">{{ value }}</h3>
        <p class="hidden truncate whitespace-nowrap text-[11px] leading-4 text-muted-foreground sm:block">{{ meta }}</p>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
