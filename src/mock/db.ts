import type { TencentDbInstance, TencentDbResponse } from '@/services/types';
import { readStorage, writeStorage } from '@/utils/storage';
import {
  createRecentTimestamp,
  pickRandom,
  randomDbName,
  randomDbType,
  randomDelay,
  randomIpv4,
  sleep,
} from './seed';

const DB_CACHE_KEY = 'cloudscope_mock_db_cache';
const DB_STATES: TencentDbInstance['Status'][] = ['RUNNING', 'PENDING', 'ISOLATED'];
const MIN_DB_COUNT = 16;
const DB_COUNT_RANGE = 12;

type DbCache = Record<string, TencentDbResponse>;

function createDbDataset(accountId: string): TencentDbResponse {
  const count = MIN_DB_COUNT + Math.floor(Math.random() * DB_COUNT_RANGE);
  const instances: TencentDbInstance[] = Array.from({ length: count }, (_, index) => ({
    InstanceId: `cdb-${accountId.slice(-4)}-${index + 1}`,
    InstanceName: randomDbName(index),
    DBInstanceType: randomDbType(),
    Status: pickRandom(DB_STATES),
    Vip: randomIpv4(index + 40),
    Vport: pickRandom([3306, 5432, 6379]),
    Volume: pickRandom([20, 50, 100, 200, 500]),
    CreateTime: createRecentTimestamp(24 + index * 9),
  }));

  return {
    Response: {
      TotalCount: instances.length,
      DBInstanceSet: instances,
    },
  };
}

function readCache(): DbCache {
  return readStorage<DbCache>(DB_CACHE_KEY, {});
}

function writeCache(cache: DbCache) {
  writeStorage(DB_CACHE_KEY, cache);
}

export async function getMockDatabaseList(accountId: string): Promise<TencentDbResponse> {
  await sleep(randomDelay());
  const cache = readCache();
  if (!cache[accountId] || cache[accountId].Response.TotalCount < MIN_DB_COUNT) {
    cache[accountId] = createDbDataset(accountId);
    writeCache(cache);
  }
  return cache[accountId];
}

export function refreshMockDatabaseList(accountId: string) {
  const cache = readCache();
  cache[accountId] = createDbDataset(accountId);
  writeCache(cache);
}
