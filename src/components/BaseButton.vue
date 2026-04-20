<template>
  <Button
    :type="type"
    :variant="resolvedVariant"
    :disabled="disabled || loading"
    :class="block ? 'w-full' : undefined"
  >
    <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
    <span>{{ loading ? loadingText : label }}</span>
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

const props = withDefaults(
  defineProps<{
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    loadingText?: string;
    disabled?: boolean;
    block?: boolean;
  }>(),
  {
    variant: 'primary',
    type: 'button',
    loading: false,
    loadingText: '处理中',
    disabled: false,
    block: false,
  },
);

const resolvedVariant = computed(() => {
  if (props.variant === 'secondary') {
    return 'outline';
  }
  if (props.variant === 'ghost') {
    return 'ghost';
  }
  if (props.variant === 'danger') {
    return 'destructive';
  }
  return 'default';
});
</script>
