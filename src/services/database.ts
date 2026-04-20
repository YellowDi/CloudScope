import { request } from './http';
import { translateDatabaseList } from './translators';
import type { DatabaseListItem, TencentDbResponse } from './types';

export async function getDatabaseList(accountId: string): Promise<DatabaseListItem[]> {
  const response = await request<TencentDbResponse>({
    path: `/api/database/list?accountId=${accountId}`,
    method: 'GET',
  });
  return translateDatabaseList(response);
}
