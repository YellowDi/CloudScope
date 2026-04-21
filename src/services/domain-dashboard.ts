import { request } from './http';
import { translateDomainDashboardList } from './translators';
import type {
  DomainDashboardListResult,
  DomainListReq,
} from './types';

const DEFAULT_DOMAIN_DASHBOARD_REQ: Required<Pick<DomainListReq, 'Full' | 'PageNum' | 'PageSize'>> = {
  PageNum: 1,
  PageSize: 20,
  Full: true,
};

export async function getDomainDashboardList(
  payload: DomainListReq = { Full: true },
): Promise<DomainDashboardListResult> {
  const body: DomainListReq = payload.Full === false
    ? {
        ...DEFAULT_DOMAIN_DASHBOARD_REQ,
        ...payload,
        Full: false,
      }
    : {
        ...payload,
        Full: true,
      };

  const response = await request<unknown, DomainListReq>({
    path: '/api/dashboard/domaindashboard/list',
    method: 'POST',
    body,
  });

  return translateDomainDashboardList(response);
}
