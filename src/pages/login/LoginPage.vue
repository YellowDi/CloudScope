<template>
  <Card class="border-border shadow-lg shadow-slate-950/5">
    <CardHeader class="space-y-2">
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="CloudScope logo" class="h-10 w-10 rounded-lg object-cover" />
        <div class="min-w-0">
          <p class="font-mono text-xs uppercase tracking-wide text-muted-foreground">CloudScope</p>
          <CardTitle class="text-3xl tracking-tight">腾讯云资源监控看板</CardTitle>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <form class="grid gap-4" @submit.prevent="handleSubmit">
        <BaseInput v-model="username" label="用户名" placeholder="请输入用户名" autocomplete="username" />
        <BaseInput v-model="password" label="密码" type="password" placeholder="请输入密码" autocomplete="current-password" />
        <BaseButton label="登录" type="submit" block :loading="authStore.loading" loading-text="登录中" />
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/app';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const username = ref('');
const password = ref('');

async function handleSubmit() {
  if (!username.value.trim() || !password.value.trim()) {
    appStore.setNotice('用户名和密码不能为空', 'error');
    return;
  }

  try {
    await authStore.login(username.value, password.value);
    await router.push('/dashboard');
  } catch (error) {
    appStore.setNotice(error instanceof Error ? error.message : '登录失败', 'error');
  }
}
</script>
