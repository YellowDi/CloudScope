import { request } from './http';
import { translateDatabaseDashboardList } from './translators';
import type {
  DashboardListReq,
  DatabaseDashboardListResult,
} from './types';

const DEFAULT_DATABASE_DASHBOARD_REQ: Required<Pick<DashboardListReq, 'Full' | 'PageNum' | 'PageSize'>> = {
  PageNum: 1,
  PageSize: 20,
  Full: true,
};

export async function getDatabaseDashboardList(
  payload: DashboardListReq = { Full: true },
): Promise<DatabaseDashboardListResult> {
  const body: DashboardListReq = payload.Full === false
    ? {
        ...DEFAULT_DATABASE_DASHBOARD_REQ,
        ...payload,
        Full: false,
      }
    : {
        ...payload,
        Full: true,
      };

  const response = await request<unknown, DashboardListReq>({
    path: '/api/dashboard/databasedashboard/list',
    method: 'POST',
    body,
  });

  return translateDatabaseDashboardList(response);
}
