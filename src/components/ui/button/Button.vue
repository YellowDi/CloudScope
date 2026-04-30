<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { cn } from '@/lib/utils'
import { Primitive } from 'reka-ui'
import { buttonVariants } from '.'
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  static?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})

const attrs = useAttrs()

const resolvedType = computed(() => {
  if (props.asChild || props.as !== 'button') {
    return undefined
  }

  return typeof attrs.type === 'string' && attrs.type.trim() ? attrs.type : 'button'
})
</script>

<template>
  <Primitive
    v-bind="attrs"
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :data-static="props.static ? 'true' : undefined"
    :as="as"
    :as-child="asChild"
    :type="resolvedType"
    :class="cn(buttonVariants({ variant, size }), !props.static && 'active:enabled:scale-[0.97]', props.class)"
  >
    <slot />
  </Primitive>
</template>
