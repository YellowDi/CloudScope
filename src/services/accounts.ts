import { request } from './http';
import type {
  CloudAccount,
  CreateAccountPayload,
  TencentAccountListItem,
  TencentAccountListRequest,
  TencentAccountListResponse,
  UpdateAccountPayload,
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
  return request<unknown, { Name: string; Region: string; SecretId: string; SecretKey: string }>({
    path: '/api/tencentaccount/new',
    method: 'POST',
    body: {
      Name: payload.name,
      Region: payload.region,
      SecretId: payload.secretId,
      SecretKey: payload.secretKey,
    },
  });
}

export async function updateAccount(payload: UpdateAccountPayload) {
  return request<unknown, { Id: number; Name: string; Region: string; Status: number }>({
    path: '/api/tencentaccount/update',
    method: 'POST',
    body: {
      Id: payload.id,
      Name: payload.name,
      Region: payload.region,
      Status: payload.status,
    },
  });
}

export async function deleteAccount(recordId: number) {
  return request<unknown>({
    path: `/api/tencentaccount/del?id=${encodeURIComponent(String(recordId))}`,
    method: 'POST',
  });
}
