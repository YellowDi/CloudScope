<template>
  <TooltipProvider>
    <RouterView />
    <Toaster position="top-center" rich-colors class="pointer-events-auto" />
  </TooltipProvider>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
</script>
