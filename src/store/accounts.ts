import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  createAccount,
  deleteAccount,
  getAccounts,
  updateAccount,
} from '@/services/accounts';
import type { CloudAccount, CreateAccountPayload, UpdateAccountPayload } from '@/services/types';
import { readStorage, writeStorage } from '@/utils/storage';

const ACCOUNTS_STORAGE_KEY = 'cloudscope_accounts';
const CURRENT_ACCOUNT_STORAGE_KEY = 'cloudscope_current_account_id';

export const useAccountsStore = defineStore('accounts', () => {
  const accountList = ref<CloudAccount[]>([]);
  const currentAccountId = ref('');
  const loading = ref(false);
  const currentAccount = computed(
    () => accountList.value.find((account) => account.id === currentAccountId.value) ?? null,
  );

  async function hydrateFromService() {
    loading.value = true;
    try {
      accountList.value = await getAccounts();
      if (
        !currentAccountId.value ||
        !accountList.value.some((account) => account.id === currentAccountId.value)
      ) {
        currentAccountId.value = accountList.value[0]?.id ?? '';
      }
      persist();
    } finally {
      loading.value = false;
    }
  }

  async function addAccount(payload: CreateAccountPayload) {
    await createAccount(payload);
    await hydrateFromService();
  }

  async function editAccount(payload: UpdateAccountPayload) {
    await updateAccount(payload);
    await hydrateFromService();
  }

  async function removeAccount(recordId: number) {
    await deleteAccount(recordId);
    await hydrateFromService();
  }

  function selectAccount(accountId: string) {
    currentAccountId.value = accountId;
    persist();
  }

  function restore() {
    accountList.value = readStorage<CloudAccount[]>(ACCOUNTS_STORAGE_KEY, []);
    currentAccountId.value = readStorage<string>(CURRENT_ACCOUNT_STORAGE_KEY, '');
    if (!currentAccountId.value || !accountList.value.some((item) => item.id === currentAccountId.value)) {
      currentAccountId.value = accountList.value[0]?.id ?? '';
      persist();
    }
  }

  function persist() {
    writeStorage(ACCOUNTS_STORAGE_KEY, accountList.value);
    writeStorage(CURRENT_ACCOUNT_STORAGE_KEY, currentAccountId.value);
  }

  return {
    accountList,
    currentAccountId,
    currentAccount,
    loading,
    hydrateFromService,
    addAccount,
    editAccount,
    removeAccount,
    selectAccount,
    restore,
  };
});
