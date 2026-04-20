import { request } from './http';
import { translateAccountBalance } from './translators';
import type { AccountBalanceSummary, TencentAccountBalanceResponse } from './types';

export async function getAccountBalanceResponse(accountId: string, includeTempCredit = true) {
  return request<TencentAccountBalanceResponse>({
    path: `/api/billing/account-balance?accountId=${accountId}&tempCredit=${String(includeTempCredit)}`,
    method: 'GET',
  });
}

export async function getAccountBalance(accountId: string, includeTempCredit = true) {
  const response = await getAccountBalanceResponse(accountId, includeTempCredit);

  return translateAccountBalance(response) as AccountBalanceSummary;
}
