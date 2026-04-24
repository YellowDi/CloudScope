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
  1: '运行中',
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
  applying: '申请中',
  init: '待初始化',
  initing: '初始化中',
  'limited run': '受限运行',
  limitedrun: '受限运行',
  isolating: '隔离中',
  isolated: '已隔离',
  disisolating: '解隔离中',
  recycling: '回收中',
  recycled: '已回收',
  'job running': '任务执行中',
  jobrunning: '任务执行中',
  offline: '下线',
  migrating: '迁移中',
  expanding: '变配中',
  waitswitch: '等待切换',
  switching: '切换中',
  readonly: '只读',
  restarting: '重启中',
  'network changing': '网络变更中',
  networkchanging: '网络变更中',
  upgrading: '内核版本升级中',
  'audit-switching': '审计状态变更中',
  'primary-switching': '主备切换中',
  offlining: '下线中',
  'deployment changing': '可用区变更中',
  deploymentchanging: '可用区变更中',
  cloning: '恢复数据中',
  'parameter modifying': '参数修改中',
  parametermodifying: '参数修改中',
  'log-switching': '日志状态变更中',
  restoring: '恢复中',
};

const text = computed(() => labelMap[props.status.toLowerCase()] ?? props.status);

const tone = computed(() => {
  const normalized = props.status.toLowerCase();
  if (
    normalized.includes('受限') ||
    normalized.includes('只读') ||
    normalized.includes('待初始化') ||
    normalized.includes('申请') ||
    normalized.includes('初始化') ||
    normalized.includes('启动') ||
    normalized.includes('创建') ||
    normalized.includes('任务') ||
    normalized.includes('迁移') ||
    normalized.includes('扩容') ||
    normalized.includes('变配') ||
    normalized.includes('切换') ||
    normalized.includes('重启') ||
    normalized.includes('变更') ||
    normalized.includes('升级') ||
    normalized.includes('恢复') ||
    normalized.includes('回收中') ||
    normalized.includes('隔离中') ||
    normalized.includes('解隔离') ||
    normalized.includes('下线中') ||
    normalized.includes('pending') ||
    normalized.includes('applying') ||
    normalized.includes('init') ||
    normalized.includes('starting') ||
    normalized.includes('stopping') ||
    normalized.includes('rebooting') ||
    normalized.includes('terminating') ||
    normalized.includes('migrating') ||
    normalized.includes('expanding') ||
    normalized.includes('switching') ||
    normalized.includes('restarting') ||
    normalized.includes('changing') ||
    normalized.includes('upgrading') ||
    normalized.includes('cloning') ||
    normalized.includes('modifying') ||
    normalized.includes('restoring') ||
    normalized.includes('limited') ||
    normalized.includes('readonly')
  ) {
    return 'warning';
  }
  if (normalized.includes('运行') || normalized.includes('connected')) {
    return 'success';
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
