<script setup lang="ts">
import type { NavigationMenuIndicatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuIndicator, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<NavigationMenuIndicatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <NavigationMenuIndicator
    v-bind="forwardedProps"
    data-slot="navigation-menu-indicator"
    :class="
      cn(
        'top-full z-[1] flex h-2 items-end justify-center overflow-hidden data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=visible]:animate-in data-[state=visible]:fade-in-0',
        props.class,
      )
    "
  >
    <div class="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm border-t border-l border-border bg-background" />
  </NavigationMenuIndicator>
</template>
