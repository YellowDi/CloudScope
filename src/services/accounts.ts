import { request } from './http';
import type { CloudAccount, CreateAccountPayload } from './types';

export async function getAccounts() {
  return request<CloudAccount[]>({
    path: '/api/accounts/list',
    method: 'GET',
  });
}

export async function createAccount(payload: CreateAccountPayload) {
  return request<CloudAccount, CreateAccountPayload>({
    path: '/api/accounts/create',
    method: 'POST',
    body: payload,
  });
}

export async function deleteAccount(accountId: string) {
  return request<void, { accountId: string }>({
    path: '/api/accounts/delete',
    method: 'POST',
    body: { accountId },
  });
}

export async function testAccountConnection(accountId: string) {
  return request<CloudAccount, { accountId: string }>({
    path: '/api/accounts/test',
    method: 'POST',
    body: { accountId },
  });
}

export async function syncAccountResources(accountId: string) {
  return request<CloudAccount, { accountId: string }>({
    path: '/api/accounts/sync',
    method: 'POST',
    body: { accountId },
  });
}
