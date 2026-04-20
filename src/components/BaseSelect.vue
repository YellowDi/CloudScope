<template>
  <div class="grid min-w-0 gap-1.5">
    <label v-if="label" class="text-sm font-medium text-foreground">{{ label }}</label>
    <Select :model-value="modelValue" @update:model-value="handleUpdate">
      <SelectTrigger class="h-9 w-full min-w-0 rounded-md bg-background text-sm">
        <SelectValue :placeholder="placeholder ?? '请选择'" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const props = defineProps<{
  label?: string;
  modelValue: string;
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function handleUpdate(value: string | undefined) {
  emit('update:modelValue', value ?? props.modelValue);
}
</script>
