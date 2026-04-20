import { request } from './http';
import { translateAccountBalance } from './translators';
import type { AccountBalanceSummary, TencentAccountBalanceResponse } from './types';

export async function getAccountBalance(accountId: string, includeTempCredit = true) {
  const response = await request<TencentAccountBalanceResponse>({
    path: `/api/billing/account-balance?accountId=${accountId}&tempCredit=${String(includeTempCredit)}`,
    method: 'GET',
  });

  return translateAccountBalance(response) as AccountBalanceSummary;
}
