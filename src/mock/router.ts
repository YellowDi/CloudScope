import type { CloudAccount, RequestOptions, TencentAccountListResponse } from '@/services/types';
import { mockLogin } from './auth';
import {
  createMockAccount,
  deleteMockAccount,
  listMockAccounts,
  syncMockAccount,
  testMockAccount,
} from './accounts';
import { getMockAccountBalance, refreshMockAccountBalance } from './billing';
import { getMockCvmList, refreshMockCvmList } from './cvm';
import { getMockDatabaseList, refreshMockDatabaseList } from './db';

type MockHeaders = Record<string, string>;

function requireAuth(headers: MockHeaders | undefined) {
  const bearer = headers?.Authorization ?? '';
  if (!bearer) {
    throw new Error('未授权访问，请重新登录');
  }
}

function getAccountId(path: string) {
  const [, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  const accountId = params.get('accountId');
  if (!accountId) {
    throw new Error('缺少 accountId');
  }
  return accountId;
}

function getTempCreditFlag(path: string) {
  const [, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  return params.get('tempCredit') !== 'false';
}

function toTencentAccountListResponse(accounts: CloudAccount[]): TencentAccountListResponse {
  return {
    List: accounts.map((account, index) => ({
      Balance: account.balance ?? 0,
      CashAccountBalance: account.cashAccountBalance ?? 0,
      CreatedAt: account.createdAt || account.lastSyncedAt,
      FreezeAmount: account.freezeAmount ?? 0,
      Id: account.recordId ?? index + 1,
      Name: account.name,
      OweAmount: account.oweAmount ?? 0,
      PresentAccountBalance: account.presentAccountBalance ?? 0,
      Region: account.region,
      Status: account.statusCode ?? (account.status === 'connected' ? 1 : 0),
      Uin: account.uin ? Number(account.uin) : 0,
      UpdatedAt: account.updatedAt || account.lastSyncedAt,
      Uuid: account.uuid || account.id,
    })),
    Total: accounts.length,
  };
}

export async function handleMockRequest<TResponse>(
  options: RequestOptions & { headers?: MockHeaders },
): Promise<TResponse> {
  const { path, method = 'GET', body, headers } = options;

  if (path === '/api/auth/login' && method === 'POST') {
    const payload = body as { username: string; password: string };
    return (await mockLogin(payload.username, payload.password)) as TResponse;
  }

  requireAuth(headers);

  if (path === '/api/accounts/list' && method === 'GET') {
    return (await listMockAccounts()) as TResponse;
  }

  if (path === '/api/tencentaccount/list' && method === 'POST') {
    return toTencentAccountListResponse(await listMockAccounts()) as TResponse;
  }

  if (path === '/api/accounts/create' && method === 'POST') {
    return (await createMockAccount(body as {
      name: string;
      region: string;
      secretId: string;
      secretKey: string;
    })) as TResponse;
  }

  if (path === '/api/tencentaccount/new' && method === 'POST') {
    const payload = body as { Name: string; Region: string; SecretId: string; SecretKey: string };
    return (await createMockAccount({
      name: payload.Name,
      region: payload.Region,
      secretId: payload.SecretId,
      secretKey: payload.SecretKey,
    })) as TResponse;
  }

  if (path === '/api/accounts/delete' && method === 'POST') {
    const payload = body as { accountId: string };
    return (await deleteMockAccount(payload.accountId)) as TResponse;
  }

  if (path === '/api/accounts/test' && method === 'POST') {
    const payload = body as { accountId: string };
    return (await testMockAccount(payload.accountId)) as TResponse;
  }

  if (path === '/api/accounts/sync' && method === 'POST') {
    const payload = body as { accountId: string };
    refreshMockCvmList(payload.accountId);
    refreshMockDatabaseList(payload.accountId);
    refreshMockAccountBalance(payload.accountId);
    return (await syncMockAccount(payload.accountId)) as TResponse;
  }

  if (path.startsWith('/api/cvm/list') && method === 'GET') {
    return (await getMockCvmList(getAccountId(path))) as TResponse;
  }

  if (path.startsWith('/api/database/list') && method === 'GET') {
    return (await getMockDatabaseList(getAccountId(path))) as TResponse;
  }

  if (path.startsWith('/api/billing/account-balance') && method === 'GET') {
    return (await getMockAccountBalance(getAccountId(path), getTempCreditFlag(path))) as TResponse;
  }

  throw new Error(`未实现的 mock 接口: ${method} ${path}`);
}
