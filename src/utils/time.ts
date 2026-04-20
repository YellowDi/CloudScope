function toValidDate(value: string | number | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateParts(date: Date): string {
  return `${date.getFullYear()}年${padDatePart(date.getMonth() + 1)}月${padDatePart(date.getDate())}日`;
}

export function formatDateTime(value: string | number | null | undefined): string {
  const date = toValidDate(value);
  if (!date) {
    return '--';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDate(value: string | number | null | undefined): string {
  const date = toValidDate(value);
  if (!date) {
    return '--';
  }

  return formatDateParts(date);
}

export function formatDateTimeWithMinutes(value: string | number | null | undefined): string {
  const date = toValidDate(value);
  if (!date) {
    return '--';
  }

  return `${formatDateParts(date)} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}
