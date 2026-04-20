import { request } from './http';
import { translateCvmList } from './translators';
import type { CvmListItem, TencentCvmResponse } from './types';

export async function getCvmList(accountId: string): Promise<CvmListItem[]> {
  const response = await request<TencentCvmResponse>({
    path: `/api/cvm/list?accountId=${accountId}`,
    method: 'GET',
  });
  return translateCvmList(response);
}
