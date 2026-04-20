<template>
  <div class="w-64 min-w-48">
    <BaseSelect :model-value="model" :options="options" placeholder="选择云账号" @update:model-value="handleChange" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAccountsStore } from '@/store/accounts';
import BaseSelect from './BaseSelect.vue';

const accountsStore = useAccountsStore();

const options = computed(() => {
  if (accountsStore.accountList.length === 0) {
    return [{ label: '暂无可用账号', value: '', disabled: true }];
  }
  return accountsStore.accountList.map((account) => ({
    label: `${account.name} · ${account.region}`,
    value: account.id,
  }));
});

const model = computed(() => accountsStore.currentAccountId);

function handleChange(value: string) {
  if (!value) {
    return;
  }
  accountsStore.selectAccount(value);
}
</script>
