<template>
  <label class="grid gap-1.5">
    <span class="text-sm font-medium text-foreground">{{ label }}</span>
    <Input
      v-bind="attrs"
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
import { useAttrs } from 'vue';
import { Input } from '@/components/ui/input';

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();

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
