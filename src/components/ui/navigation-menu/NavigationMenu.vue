<script setup lang="ts">
import type { NavigationMenuRootEmits, NavigationMenuRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  NavigationMenuRoot,
  NavigationMenuViewport as NavigationMenuViewportPrimitive,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<NavigationMenuRootProps & {
    class?: HTMLAttributes['class']
    viewport?: boolean
    viewportClass?: HTMLAttributes['class']
  }>(),
  {
    viewport: true,
  },
)
const emits = defineEmits<NavigationMenuRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'viewport', 'viewportClass')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <NavigationMenuRoot
    v-bind="forwarded"
    data-slot="navigation-menu"
    :class="cn('relative z-10 flex w-full items-center justify-center', props.class)"
  >
    <slot />

    <div v-if="props.viewport" class="absolute top-full left-0 flex w-full justify-center">
      <NavigationMenuViewportPrimitive
        :class="
          cn(
            'origin-top-center relative mt-1.5 h-[var(--reka-navigation-menu-viewport-height)] w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-card)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 md:w-[var(--reka-navigation-menu-viewport-width)]',
            props.viewportClass,
          )
        "
      />
    </div>
  </NavigationMenuRoot>
</template>
