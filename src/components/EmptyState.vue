<template>
  <Card class="border-dashed shadow-none">
    <CardContent class="grid gap-3 px-8 py-10 text-center">
      <p class="text-xl font-semibold tracking-tight text-foreground">{{ title }}</p>
      <p class="text-sm text-muted-foreground">{{ description }}</p>
      <Button v-if="actionTo && actionLabel" as-child class="justify-self-center">
        <RouterLink :to="actionTo">
          {{ actionLabel }}
        </RouterLink>
      </Button>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

defineProps<{
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}>();
</script>
