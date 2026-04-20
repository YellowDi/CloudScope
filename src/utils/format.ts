export function formatSpec(cpu: number, memory: number): string {
  return `${cpu} 核 / ${memory} GB`;
}

export function formatStorage(size: number): string {
  return `${size} GB`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

export function formatCurrencyFromCent(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
