import { formatCurrencyFromCent, formatSpec, formatStorage } from '@/utils/format';
import type {
  AccountBalanceSummary,
  CloudDashboardListResult,
  CloudDashboardInstanceItem,
  CloudInstanceListResponse,
  CloudInstanceRow,
  CvmListItem,
  DashboardStats,
  DatabaseListItem,
  TencentAccountBalanceResponse,
  TencentCvmResponse,
  TencentDbResponse,
} from './types';

const CVM_STATUS_MAP: Record<string, string> = {
  RUNNING: '运行中',
  STOPPED: '已停止',
  PENDING: '启动中',
};

const DB_STATUS_MAP: Record<string, string> = {
  RUNNING: '运行中',
  PENDING: '创建中',
  ISOLATED: '隔离中',
};

export function translateCvmList(response: TencentCvmResponse): CvmListItem[] {
  return response.Response.InstanceSet.map((instance) => ({
    id: instance.InstanceId,
    name: instance.InstanceName,
    status: CVM_STATUS_MAP[instance.InstanceState] ?? instance.InstanceState,
    statusCode: instance.InstanceState,
    publicIp: instance.PublicIpAddresses[0] ?? '--',
    privateIp: instance.PrivateIpAddresses[0] ?? '--',
    spec: formatSpec(instance.CPU, instance.Memory),
    createdAt: instance.CreatedTime,
  }));
}

function formatCloudDashboardSpec(instance: CloudInstanceRow): string {
  const segments: string[] = [];

  if (instance.CPU !== undefined || instance.Memory !== undefined) {
    const cpu = instance.CPU ?? '--';
    const memory = instance.Memory ?? '--';
    segments.push(`${cpu} 核 / ${memory} GB`);
  }

  if (instance.DiskType || instance.DiskSize) {
    segments.push([instance.DiskType, instance.DiskSize].filter(Boolean).join(' / '));
  }

  if (instance.InternetMaxBandwidthOut !== undefined) {
    segments.push(`${instance.InternetMaxBandwidthOut} Mbps`);
  }

  return segments.join(' · ') || '--';
}

function normalizeCloudDashboardStatus(status?: string): CloudDashboardInstanceItem['status'] {
  if (!status) {
    return '未知';
  }

  return CVM_STATUS_MAP[status] ?? status;
}

export function translateCloudDashboardList(
  response: CloudInstanceListResponse,
): CloudDashboardListResult {
  const list = (response.List ?? []).map((instance) => {
    const accountId = instance.AccountUuid?.trim() || String(instance.AccountId ?? '').trim();
    const id = instance.InstanceID?.trim() || '--';
    const accountName = instance.AccountName?.trim();

    return {
      rowId: `${accountId || 'unknown'}:${id}`,
      accountId,
      account: accountName || accountId || '--',
      id,
      name: instance.InstanceName?.trim() || '--',
      status: normalizeCloudDashboardStatus(instance.InstanceState?.trim()),
      statusCode: instance.InstanceState?.trim() || 'UNKNOWN',
      publicIp: instance.PublicIpAddresses?.trim() || '--',
      privateIp: instance.PrivateIpAddresses?.trim() || '--',
      spec: formatCloudDashboardSpec(instance),
      zone: instance.Zone?.trim() || '--',
      chargeType: instance.InstanceChargeType?.trim() || '--',
      expiredTime: instance.ExpiredTime?.trim() || '',
      remark: instance.Remark?.trim() || '--',
    };
  });

  return {
    list,
    total: response.Total ?? list.length,
  };
}

export function translateDatabaseList(response: TencentDbResponse): DatabaseListItem[] {
  return response.Response.DBInstanceSet.map((instance) => ({
    id: instance.InstanceId,
    name: instance.InstanceName,
    type: instance.DBInstanceType,
    status: DB_STATUS_MAP[instance.Status] ?? instance.Status,
    statusCode: instance.Status,
    address: `${instance.Vip}:${instance.Vport}`,
    storage: formatStorage(instance.Volume),
    createdAt: instance.CreateTime,
  }));
}

export function buildDashboardStats(
  cvmList: Array<{ statusCode: string }>,
  databaseList: Array<{ statusCode: string }>,
): DashboardStats {
  const runningCount =
    cvmList.filter((item) => item.statusCode === 'RUNNING').length +
    databaseList.filter((item) => item.statusCode === 'RUNNING').length;

  const abnormalCount =
    cvmList.filter((item) => item.statusCode !== 'RUNNING').length +
    databaseList.filter((item) => item.statusCode !== 'RUNNING').length;

  return {
    cvmTotal: cvmList.length,
    databaseTotal: databaseList.length,
    runningCount,
    abnormalCount,
  };
}

export function translateAccountBalance(
  response: TencentAccountBalanceResponse,
): AccountBalanceSummary {
  const { Response: payload } = response;

  return {
    uin: String(payload.Uin),
    availableBalance: formatCurrencyFromCent(payload.Balance),
    cashBalance: formatCurrencyFromCent(payload.CashAccountBalance),
    incomeBalance: formatCurrencyFromCent(payload.IncomeIntoAccountBalance),
    presentBalance: formatCurrencyFromCent(payload.PresentAccountBalance),
    freezeAmount: formatCurrencyFromCent(payload.FreezeAmount),
    oweAmount: formatCurrencyFromCent(payload.OweAmount),
    creditAmount: formatCurrencyFromCent(payload.CreditAmount),
    creditBalance: formatCurrencyFromCent(payload.CreditBalance),
    realCreditBalance: formatCurrencyFromCent(payload.RealCreditBalance),
    tempCredit: formatCurrencyFromCent(payload.TempCredit),
    tempAmountInfoList: payload.TempAmountInfoList.map((item) => ({
      uin: item.Uin,
      tempAmount: formatCurrencyFromCent(item.TempAmount),
      startTime: item.StartTime,
      endTime: item.EndTime,
    })),
  };
}
