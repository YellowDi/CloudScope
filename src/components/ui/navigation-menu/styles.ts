import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export const navigationMenuTriggerStyle = cva(
  'group inline-flex h-8 w-max items-center justify-center gap-1 rounded-md px-3 text-xs font-medium whitespace-nowrap text-muted-foreground outline-none ring-offset-background transition-[background-color,color,box-shadow] duration-180 ease-out hover:bg-[var(--interactive-hover)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-secondary data-[active]:text-secondary-foreground data-[state=open]:bg-secondary data-[state=open]:text-secondary-foreground',
)

export type NavigationMenuTriggerVariants = VariantProps<typeof navigationMenuTriggerStyle>
