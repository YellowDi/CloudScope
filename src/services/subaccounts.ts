import { request } from './http';
import type {
  CreateSubAccountPayload,
  DeleteSubAccountPayload,
  QuickLoginSubAccountPayload,
  SubAccount,
  SubAccountQuickLoginResult,
} from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getField<T = unknown>(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }

  return undefined;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  const value = getField(record, keys);
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  const value = getField(record, keys);

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function extractSubAccountItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const directList = getField<unknown>(record, ['List', 'list']);
  if (Array.isArray(directList)) {
    return directList;
  }

  const nestedData = getField<unknown>(record, ['Data', 'data']);
  if (nestedData) {
    return extractSubAccountItems(nestedData);
  }

  return [];
}

function normalizeSubAccount(item: unknown, index: number): SubAccount {
  const record = asRecord(item) ?? {};
  const recordId = readNumber(record, ['Id', 'id']);
  const name = readString(record, ['SubAccountName', 'subAccountName']);
  const uin = readNumber(record, ['SubAccountUin', 'subAccountUin']);
  const tencentAccountName = readString(record, ['TencentAccountName', 'tencentAccountName']);
  const tencentAccountUin = readNumber(record, ['TencentAccountUin', 'tencentAccountUin']);
  const tencentAccountUuid = readString(record, ['TencentAccountUuid', 'tencentAccountUuid']);
  const displayName =
    readString(record, ['SubAccountDisplayName', 'subAccountDisplayName']) ||
    [name, tencentAccountUin].filter(Boolean).join('@');
  const fallbackId =
    (recordId !== undefined ? String(recordId) : '') ||
    displayName ||
    [name, uin].filter(Boolean).join('@') ||
    `sub-account-${index}`;

  return {
    id: fallbackId,
    recordId,
    displayName: displayName || name || '未命名子账号',
    name: name || '--',
    uin: uin === undefined ? undefined : String(uin),
    tencentAccountName: tencentAccountName || '--',
    tencentAccountUin: tencentAccountUin === undefined ? undefined : String(tencentAccountUin),
    tencentAccountUuid: tencentAccountUuid || undefined,
  };
}

export async function getSubAccounts() {
  const response = await request<unknown, Record<string, never>>({
    path: '/api/subaccount/list',
    method: 'POST',
    body: {},
  });

  return extractSubAccountItems(response).map(normalizeSubAccount);
}

export async function createSubAccount(payload: CreateSubAccountPayload) {
  return request<unknown, {
    Password: string;
    Status: number;
    SubAccountName: string;
    SubAccountUin?: number;
    TencentAccountName: string;
    TencentAccountUin?: number;
    TencentAccountUuid?: string;
  }>({
    path: '/api/subaccount/new',
    method: 'POST',
    body: {
      Password: payload.password,
      Status: payload.status ?? 1,
      SubAccountName: payload.subAccountName,
      SubAccountUin: payload.subAccountUin,
      TencentAccountName: payload.tencentAccountName,
      TencentAccountUin: payload.tencentAccountUin,
      TencentAccountUuid: payload.tencentAccountUuid,
    },
  });
}

export async function deleteSubAccount(payload: DeleteSubAccountPayload) {
  return request<unknown, {
    Id: number;
    Status: number;
    SubAccountName: string;
    SubAccountUin?: number;
    TencentAccountName: string;
    TencentAccountUin?: number;
    TencentAccountUuid?: string;
  }>({
    path: '/api/subaccount/update',
    method: 'POST',
    body: {
      Id: payload.id,
      Status: 2,
      SubAccountName: payload.subAccountName,
      SubAccountUin: payload.subAccountUin,
      TencentAccountName: payload.tencentAccountName,
      TencentAccountUin: payload.tencentAccountUin,
      TencentAccountUuid: payload.tencentAccountUuid,
    },
  });
}

export async function getSubAccountQuickLogin(payload: QuickLoginSubAccountPayload) {
  const response = await request<unknown, {
    Id?: number;
    SubAccountName: string;
    SubAccountUin?: number;
    TencentAccountName: string;
    TencentAccountUin?: number;
    TencentAccountUuid?: string;
  }>({
    path: '/api/subaccount/quick_login',
    method: 'POST',
    body: {
      Id: payload.id,
      SubAccountName: payload.subAccountName,
      SubAccountUin: payload.subAccountUin,
      TencentAccountName: payload.tencentAccountName,
      TencentAccountUin: payload.tencentAccountUin,
      TencentAccountUuid: payload.tencentAccountUuid,
    },
  });

  const record = asRecord(response) ?? {};

  return {
    loginUrl: readString(record, ['LoginURL', 'loginUrl', 'LoginUrl']) || '',
    password: readString(record, ['Password', 'password']) || '',
  } satisfies SubAccountQuickLoginResult;
}
