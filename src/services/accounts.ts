import { request } from './http';
import type {
  CloudAccount,
  CreateAccountPayload,
  TencentAccountListItem,
  TencentAccountListRequest,
  TencentAccountListResponse,
} from './types';

function normalizeAccount(item: TencentAccountListItem): CloudAccount {
  const recordId = item.Id;
  const uuid = item.Uuid?.trim();
  const createdAt = item.CreatedAt?.trim() ?? '';
  const updatedAt = item.UpdatedAt?.trim() ?? '';

  return {
    id: uuid || (recordId !== undefined ? String(recordId) : ''),
    name: item.Name?.trim() || '未命名账号',
    region: item.Region?.trim() || '--',
    status: item.Status === undefined ? '未知' : `状态码 ${item.Status}`,
    statusCode: item.Status,
    lastSyncedAt: updatedAt || createdAt,
    createdAt,
    updatedAt,
    uuid,
    recordId,
    uin: item.Uin === undefined ? undefined : String(item.Uin),
    balance: item.Balance,
    cashAccountBalance: item.CashAccountBalance,
    freezeAmount: item.FreezeAmount,
    oweAmount: item.OweAmount,
    presentAccountBalance: item.PresentAccountBalance,
    credentialConfigured: true,
  };
}

export async function getAccounts() {
  const response = await request<TencentAccountListResponse, TencentAccountListRequest>({
    path: '/api/tencentaccount/list',
    method: 'POST',
    body: {
      Full: true,
      PageNum: 0,
      PageSize: 0,
    },
  });

  return (response.List ?? []).map(normalizeAccount).filter((account) => account.id);
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
