<template>
  <header class="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
    <div>
      <p v-if="eyebrow" class="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">{{ eyebrow }}</p>
      <h1 class="text-3xl font-semibold tracking-tight text-foreground">{{ title }}</h1>
      <p v-if="description" class="mt-2 text-sm text-muted-foreground md:text-base">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>
