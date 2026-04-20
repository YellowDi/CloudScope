<template>
  <RouterView />
  <Toaster position="top-center" rich-colors class="pointer-events-auto" />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { Toaster } from '@/components/ui/sonner';
</script>
