<template>
  <Badge :variant="badgeVariant" :class="badgeClass">{{ text }}</Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';

const props = defineProps<{
  status: string;
}>();

const labelMap: Record<string, string> = {
  connected: '已连接',
  error: '异常',
  running: '运行中',
  stopped: '已停止',
  pending: '启动中',
  isolated: '隔离中',
};

const text = computed(() => labelMap[props.status.toLowerCase()] ?? props.status);

const tone = computed(() => {
  const normalized = props.status.toLowerCase();
  if (normalized.includes('运行') || normalized.includes('connected')) {
    return 'success';
  }
  if (normalized.includes('启动') || normalized.includes('创建') || normalized.includes('pending')) {
    return 'warning';
  }
  return 'error';
});

const badgeVariant = computed(() => (tone.value === 'error' ? 'destructive' : 'secondary'));

const badgeClass = computed(() => {
  if (tone.value === 'success') {
    return 'border-transparent bg-blue-50 text-blue-700 hover:bg-blue-50';
  }
  if (tone.value === 'warning') {
    return 'border-transparent bg-pink-50 text-pink-700 hover:bg-pink-50';
  }
  return 'border-transparent bg-red-50 text-red-600 hover:bg-red-50';
});
</script>
