<template>
  <label class="grid gap-1.5">
    <span class="text-sm font-medium text-foreground">{{ label }}</span>
    <Input
      :model-value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      class="h-9"
      @update:model-value="$emit('update:modelValue', String($event ?? ''))"
    />
  </label>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input';

defineProps<{
  label: string;
  modelValue: string;
  placeholder?: string;
  type?: string;
  autocomplete?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
