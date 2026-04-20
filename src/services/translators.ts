import { formatCurrencyFromCent, formatSpec, formatStorage } from '@/utils/format';
import type {
  AccountBalanceSummary,
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
  cvmList: CvmListItem[],
  databaseList: DatabaseListItem[],
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
