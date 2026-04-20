import { cn } from '@/lib/utils';

export const tableTheme = {
  wrapper:
    'relative min-w-0 w-full max-w-full overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border-whisper)] bg-card shadow-[var(--shadow-card)]',
  scrollViewport:
    'min-w-0 w-full max-w-full overflow-x-auto overflow-y-visible overscroll-x-contain bg-background',
  scrollContent: 'min-w-full bg-background',
  table:
    'min-w-full w-full table-auto border-separate border-spacing-0 bg-background text-[14px] text-foreground',
  head: 'relative z-10 text-muted-foreground',
  headActive: 'shadow-[inset_0_-1px_0_hsl(var(--border))]',
  body: 'text-foreground',
  row: 'group transition-colors hover:bg-[var(--surface-hover-subtle)]',
  summary: 'border-t border-border px-4 py-3 text-[13px] text-muted-foreground',
  headerCell: {
    base: 'h-[38px] border-b border-border bg-[var(--surface-secondary)] px-3 py-0 text-left align-middle text-[13px] font-medium whitespace-nowrap',
  },
  bodyCell: {
    base: 'h-[42px] border-b border-border px-3 py-0 align-middle whitespace-nowrap select-text',
    numeric: 'text-right tabular-nums',
  },
  empty: 'flex min-h-[min(320px,50vh)] w-full items-center justify-center px-4 py-16',
  loadingLine:
    'h-4 rounded-md bg-muted',
} as const;

export function getTableWrapperClass(override?: string) {
  return cn(tableTheme.wrapper, override);
}

export function getTableClass(override?: string) {
  return cn(tableTheme.table, override);
}
