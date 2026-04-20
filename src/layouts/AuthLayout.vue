<template>
  <main class="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
    <div class="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />
    <section class="relative w-full max-w-md">
      <RouterView />
    </section>
  </main>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>
