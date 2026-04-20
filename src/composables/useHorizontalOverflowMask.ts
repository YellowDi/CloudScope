import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { toValue, type MaybeRefOrGetter } from 'vue';

export function useHorizontalOverflowMask(options: {
  watchSource?: MaybeRefOrGetter<readonly unknown[]>;
}) {
  const scrollViewportRef = ref<HTMLElement | null>(null);
  const overflowLeft = ref(false);
  const overflowRight = ref(false);
  let resizeObserver: ResizeObserver | null = null;

  function syncOverflowState() {
    const element = scrollViewportRef.value;
    if (!element) {
      overflowLeft.value = false;
      overflowRight.value = false;
      return;
    }

    const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
    overflowLeft.value = element.scrollLeft > 2;
    overflowRight.value = maxScrollLeft - element.scrollLeft > 2;
  }

  function scheduleSync() {
    void nextTick(syncOverflowState);
  }

  function handleScroll() {
    syncOverflowState();
  }

  onMounted(() => {
    scheduleSync();

    if (typeof ResizeObserver !== 'undefined' && scrollViewportRef.value) {
      resizeObserver = new ResizeObserver(() => {
        syncOverflowState();
      });
      resizeObserver.observe(scrollViewportRef.value);
    }

    window.addEventListener('resize', syncOverflowState);
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    window.removeEventListener('resize', syncOverflowState);
  });

  if (options.watchSource) {
    watch(() => toValue(options.watchSource), scheduleSync, { deep: true });
  }

  return {
    scrollViewportRef,
    overflowLeft,
    overflowRight,
    handleScroll,
    syncOverflowState,
  };
}
