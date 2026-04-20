import { request } from './http';
import type {
  CloudAccount,
  CreateAccountPayload,
  TencentAccountListRequest,
  UpdateAccountPayload,
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

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  const value = getField(record, keys);

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return undefined;
}

function extractAccountItems(payload: unknown): unknown[] {
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
    return extractAccountItems(nestedData);
  }

  return [];
}

function normalizeAccount(item: unknown, index: number): CloudAccount {
  const record = asRecord(item) ?? {};
  const recordId = readNumber(record, ['Id', 'id']);
  const uuid = readString(record, ['Uuid', 'uuid']);
  const createdAt = readString(record, ['CreatedAt', 'createdAt']);
  const updatedAt = readString(record, ['UpdatedAt', 'updatedAt']);
  const uin = readNumber(record, ['Uin', 'uin']);
  const name = readString(record, ['Name', 'name']);
  const statusCode = readNumber(record, ['Status', 'status']);
  const region = readString(record, ['Region', 'region']);
  const fallbackId =
    uuid ||
    (recordId !== undefined ? String(recordId) : '') ||
    (uin !== undefined ? String(uin) : '') ||
    (name ? `${name}-${index}` : `account-${index}`);

  return {
    id: fallbackId,
    name: name || '未命名账号',
    region: region || '--',
    status: statusCode === undefined ? '未知' : `状态码 ${statusCode}`,
    statusCode,
    lastSyncedAt: updatedAt || createdAt,
    createdAt,
    updatedAt,
    uuid: uuid || undefined,
    recordId,
    uin: uin === undefined ? undefined : String(uin),
    balance: readNumber(record, ['Balance', 'balance']),
    cashAccountBalance: readNumber(record, ['CashAccountBalance', 'cashAccountBalance']),
    freezeAmount: readNumber(record, ['FreezeAmount', 'freezeAmount']),
    oweAmount: readNumber(record, ['OweAmount', 'oweAmount']),
    presentAccountBalance: readNumber(record, ['PresentAccountBalance', 'presentAccountBalance']),
    credentialConfigured: readBoolean(record, ['CredentialConfigured', 'credentialConfigured']) ?? true,
  };
}

export async function getAccounts() {
  const response = await request<unknown, TencentAccountListRequest>({
    path: '/api/tencentaccount/list',
    method: 'POST',
    body: {
      Full: true,
      PageNum: 0,
      PageSize: 0,
    },
  });

  return extractAccountItems(response).map(normalizeAccount);
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
  return request<unknown, { Id: number }>({
    path: '/api/tencentaccount/del',
    method: 'POST',
    body: {
      Id: recordId,
    },
  });
}
