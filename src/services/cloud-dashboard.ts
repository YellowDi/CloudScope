import { request } from './http';
import { translateCloudDashboardList } from './translators';
import type {
  CloudDashboardListResult,
  CloudInstanceListReq,
} from './types';

const DEFAULT_CLOUD_DASHBOARD_REQ: Required<Pick<CloudInstanceListReq, 'Full' | 'PageNum' | 'PageSize'>> = {
  PageNum: 1,
  PageSize: 20,
  Full: true,
};

export async function getCloudDashboardList(
  payload: CloudInstanceListReq = { Full: true },
): Promise<CloudDashboardListResult> {
  const body: CloudInstanceListReq = payload.Full === false
    ? {
        ...DEFAULT_CLOUD_DASHBOARD_REQ,
        ...payload,
        Full: false,
      }
    : {
        ...payload,
        Full: true,
      };

  const response = await request<unknown, CloudInstanceListReq>({
    path: '/api/dashboard/clouddashboard/list',
    method: 'POST',
    body,
  });

  return translateCloudDashboardList(response);
}
