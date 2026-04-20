import type { TencentCvmInstance, TencentCvmResponse } from '@/services/types';
import { formatDateTime } from '@/utils/time';
import { readStorage, writeStorage } from '@/utils/storage';
import {
  createRecentTimestamp,
  pickRandom,
  randomCvmName,
  randomDelay,
  randomIpv4,
  randomPublicIpv4,
  sleep,
} from './seed';

const CVM_CACHE_KEY = 'cloudscope_mock_cvm_cache';
const CVM_STATES: TencentCvmInstance['InstanceState'][] = ['RUNNING', 'STOPPED', 'PENDING'];
const MIN_CVM_COUNT = 24;
const CVM_COUNT_RANGE = 16;

type CvmCache = Record<string, TencentCvmResponse>;

function createCvmDataset(accountId: string): TencentCvmResponse {
  const count = MIN_CVM_COUNT + Math.floor(Math.random() * CVM_COUNT_RANGE);
  const instanceSet: TencentCvmInstance[] = Array.from({ length: count }, (_, index) => {
    const cpu = pickRandom([2, 4, 8, 16]);
    const memory = pickRandom([4, 8, 16, 32]);
    const segment = index + 10;
    return {
      InstanceId: `ins-${accountId.slice(-4)}-${index + 1}`,
      InstanceName: randomCvmName(index),
      InstanceState: pickRandom(CVM_STATES),
      PublicIpAddresses: [randomPublicIpv4()],
      PrivateIpAddresses: [randomIpv4(segment)],
      CPU: cpu,
      Memory: memory,
      CreatedTime: createRecentTimestamp(12 + index * 5),
    };
  });

  return {
    Response: {
      TotalCount: instanceSet.length,
      InstanceSet: instanceSet,
    },
  };
}

function readCache(): CvmCache {
  return readStorage<CvmCache>(CVM_CACHE_KEY, {});
}

function writeCache(cache: CvmCache) {
  writeStorage(CVM_CACHE_KEY, cache);
}

export async function getMockCvmList(accountId: string): Promise<TencentCvmResponse> {
  await sleep(randomDelay());
  const cache = readCache();
  if (!cache[accountId] || cache[accountId].Response.TotalCount < MIN_CVM_COUNT) {
    cache[accountId] = createCvmDataset(accountId);
    writeCache(cache);
  }
  return cache[accountId];
}

export function refreshMockCvmList(accountId: string) {
  const cache = readCache();
  cache[accountId] = createCvmDataset(accountId);
  writeCache(cache);
}

export function getCvmDebugSummary(accountId: string) {
  const dataset = readCache()[accountId];
  if (!dataset) {
    return '--';
  }
  return `${dataset.Response.TotalCount} 台，最近创建 ${formatDateTime(
    dataset.Response.InstanceSet[0]?.CreatedTime,
  )}`;
}
