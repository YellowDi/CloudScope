import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-medium outline-none ring-offset-background transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-180 ease-out focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-border)] hover:brightness-[0.97] hover:shadow-[var(--shadow-border-hover)]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[var(--shadow-border)] hover:brightness-[0.97] hover:shadow-[var(--shadow-border-hover)]',
        outline:
          'border-transparent bg-background text-muted-foreground shadow-[var(--shadow-border)] hover:bg-[var(--surface-hover-subtle-solid)] hover:text-foreground hover:shadow-[var(--shadow-border-hover)]',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground shadow-[var(--shadow-border)] hover:bg-[var(--surface-hover-subtle-solid)] hover:shadow-[var(--shadow-border-hover)]',
        ghost: 'text-muted-foreground hover:bg-[var(--interactive-hover)] hover:text-foreground',
        link: 'border-none p-0 text-[var(--theme-primary)] shadow-none hover:text-[var(--brand-hover)] hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:pl-4 has-[>svg]:pr-3.5',
        sm: 'h-8 px-3 text-xs has-[>svg]:pl-2.5 has-[>svg]:pr-2.5',
        lg: 'h-11 px-6 has-[>svg]:pl-6 has-[>svg]:pr-5.5',
        icon: 'size-10',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
