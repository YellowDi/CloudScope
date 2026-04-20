import { request } from './http';
import { normalizeAccountBalanceResponse, translateAccountBalance } from './translators';
import type { AccountBalanceSummary, TencentAccountBalanceResponse } from './types';

export async function getAccountBalanceResponse(accountId: string, includeTempCredit = true) {
  const response = await request<unknown>({
    path: `/api/billing/account-balance?accountId=${accountId}&tempCredit=${String(includeTempCredit)}`,
    method: 'GET',
  });

  return normalizeAccountBalanceResponse(response) as TencentAccountBalanceResponse;
}

export async function getAccountBalance(accountId: string, includeTempCredit = true) {
  const response = await getAccountBalanceResponse(accountId, includeTempCredit);

  return translateAccountBalance(response) as AccountBalanceSummary;
}
