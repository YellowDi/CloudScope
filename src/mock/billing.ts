import type { TencentAccountBalanceResponse, TencentTempAmountInfo } from '@/services/types';
import { readStorage, writeStorage } from '@/utils/storage';
import { createId, randomBoolean, randomDelay, sleep } from './seed';

const BILLING_CACHE_KEY = 'cloudscope_mock_billing_cache';

type BillingCache = Record<string, TencentAccountBalanceResponse>;

function randomCent(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

function createTempAmountInfo(accountId: string): TencentTempAmountInfo[] {
  if (!randomBoolean(0.35)) {
    return [];
  }

  const startTime = '2026-04-01 00:00:00';
  const endTime = '2026-06-30 23:59:59';

  return [
    {
      Uin: `10${accountId.slice(-8).padStart(8, '0')}`,
      TempAmount: randomCent(50_000, 300_000),
      StartTime: startTime,
      EndTime: endTime,
    },
  ];
}

function createBillingDataset(accountId: string): TencentAccountBalanceResponse {
  const cashBalance = randomCent(80_000, 2_500_000);
  const incomeBalance = randomCent(0, 120_000);
  const presentBalance = randomCent(0, 80_000);
  const freezeAmount = randomCent(0, 60_000);
  const oweAmount = randomBoolean(0.2) ? randomCent(0, 30_000) : 0;
  const creditAmount = randomBoolean(0.55) ? randomCent(100_000, 1_500_000) : 0;
  const creditBalance = creditAmount === 0 ? 0 : Math.max(0, creditAmount - randomCent(0, creditAmount * 0.4));
  const realCreditBalance = Math.max(0, creditBalance - oweAmount);
  const tempAmountInfoList = createTempAmountInfo(accountId);
  const tempCredit = tempAmountInfoList.reduce((sum, item) => sum + item.TempAmount, 0);
  const realBalance = Math.max(0, cashBalance + incomeBalance + presentBalance - freezeAmount);
  const uin = Number(`60${accountId.replace(/\D/g, '').slice(-10).padStart(10, '0')}`);

  return {
    Response: {
      Balance: realBalance,
      Uin: uin,
      RealBalance: realBalance,
      CashAccountBalance: cashBalance,
      IncomeIntoAccountBalance: incomeBalance,
      PresentAccountBalance: presentBalance,
      FreezeAmount: freezeAmount,
      OweAmount: oweAmount,
      CreditAmount: creditAmount,
      CreditBalance: creditBalance,
      RealCreditBalance: realCreditBalance,
      TempCredit: tempCredit,
      TempAmountInfoList: tempAmountInfoList,
      RequestId: createId('req'),
      IsAllowArrears: creditAmount > 0,
      IsCreditLimited: creditAmount > 0,
    },
  };
}

function readCache(): BillingCache {
  return readStorage<BillingCache>(BILLING_CACHE_KEY, {});
}

function writeCache(cache: BillingCache) {
  writeStorage(BILLING_CACHE_KEY, cache);
}

export async function getMockAccountBalance(
  accountId: string,
  includeTempCredit = true,
): Promise<TencentAccountBalanceResponse> {
  await sleep(randomDelay());
  const cache = readCache();
  if (!cache[accountId]) {
    cache[accountId] = createBillingDataset(accountId);
    writeCache(cache);
  }

  const dataset = cache[accountId];
  if (includeTempCredit) {
    return dataset;
  }

  return {
    Response: {
      ...dataset.Response,
      TempCredit: 0,
      TempAmountInfoList: [],
    },
  };
}

export function refreshMockAccountBalance(accountId: string) {
  const cache = readCache();
  cache[accountId] = createBillingDataset(accountId);
  writeCache(cache);
}
