import type { AccountStatus, CloudAccount, CreateAccountPayload } from '@/services/types';
import { createId, createRecentTimestamp, randomBoolean, randomDelay, randomRegion, sleep } from './seed';
import { readStorage, writeStorage } from '@/utils/storage';

const ACCOUNT_STORAGE_KEY = 'cloudscope_accounts';

function createDefaultAccounts(): CloudAccount[] {
  return [
    {
      id: createId('acct'),
      name: '生产主账号',
      region: 'ap-guangzhou',
      status: 'connected',
      lastSyncedAt: createRecentTimestamp(1),
      credentialConfigured: true,
    },
    {
      id: createId('acct'),
      name: '数据平台账号',
      region: randomRegion(),
      status: 'error',
      lastSyncedAt: createRecentTimestamp(8),
      credentialConfigured: true,
    },
  ];
}

function ensureAccounts(): CloudAccount[] {
  const existing = readStorage<CloudAccount[]>(ACCOUNT_STORAGE_KEY, []);
  if (existing.length > 0) {
    return existing;
  }
  const defaults = createDefaultAccounts();
  writeStorage(ACCOUNT_STORAGE_KEY, defaults);
  return defaults;
}

function saveAccounts(accounts: CloudAccount[]) {
  writeStorage(ACCOUNT_STORAGE_KEY, accounts);
}

export async function listMockAccounts() {
  await sleep(randomDelay());
  return ensureAccounts();
}

export async function createMockAccount(payload: CreateAccountPayload) {
  await sleep(randomDelay());
  const accounts = ensureAccounts();
  const next: CloudAccount = {
    id: createId('acct'),
    name: payload.name,
    region: payload.region,
    status: 'connected',
    lastSyncedAt: createRecentTimestamp(0),
    credentialConfigured: false,
  };
  const result = [...accounts, next];
  saveAccounts(result);
  return next;
}

export async function deleteMockAccount(accountId: string) {
  await sleep(randomDelay());
  const accounts = ensureAccounts().filter((account) => account.id !== accountId);
  saveAccounts(accounts);
}

export async function testMockAccount(accountId: string) {
  await sleep(randomDelay());
  const accounts = ensureAccounts();
  const nextStatus: AccountStatus = randomBoolean(0.72) ? 'connected' : 'error';
  const updated: CloudAccount[] = accounts.map((account) =>
    account.id === accountId
      ? {
          ...account,
          status: nextStatus,
        }
      : account,
  );
  saveAccounts(updated);
  const target = updated.find((account) => account.id === accountId);
  if (!target) {
    throw new Error('云账号不存在');
  }
  return target;
}

export async function syncMockAccount(accountId: string) {
  await sleep(randomDelay());
  const accounts = ensureAccounts();
  const updated: CloudAccount[] = accounts.map((account) =>
    account.id === accountId
      ? {
          ...account,
          status: 'connected',
          lastSyncedAt: new Date().toISOString(),
        }
      : account,
  );
  saveAccounts(updated);
  const target = updated.find((account) => account.id === accountId);
  if (!target) {
    throw new Error('云账号不存在');
  }
  return target;
}
