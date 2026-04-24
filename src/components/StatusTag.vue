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
  shutdown: '已关机',
  stopped: '已停止',
  pending: '启动中',
  starting: '启动中',
  stopping: '关机中',
  rebooting: '重启中',
  launch_failed: '启动失败',
  terminating: '销毁中',
  isolated: '隔离中',
};

const text = computed(() => labelMap[props.status.toLowerCase()] ?? props.status);

const tone = computed(() => {
  const normalized = props.status.toLowerCase();
  if (normalized.includes('运行') || normalized.includes('connected')) {
    return 'success';
  }
  if (
    normalized.includes('启动') ||
    normalized.includes('创建') ||
    normalized.includes('重启') ||
    normalized.includes('pending') ||
    normalized.includes('starting') ||
    normalized.includes('stopping') ||
    normalized.includes('rebooting') ||
    normalized.includes('terminating')
  ) {
    return 'warning';
  }
  return 'error';
});

const badgeVariant = computed(() => (tone.value === 'error' ? 'destructive' : 'secondary'));

const badgeClass = computed(() => {
  if (tone.value === 'success') {
    return 'border-transparent bg-[var(--success-surface)] text-[var(--success)] hover:bg-[var(--success-surface)]';
  }
  if (tone.value === 'warning') {
    return 'border-transparent bg-[var(--warning-surface)] text-[var(--warning-foreground)] hover:bg-[var(--warning-surface)]';
  }
  return 'border-transparent bg-[var(--destructive-surface)] text-destructive hover:bg-[var(--destructive-surface)]';
});
</script>
