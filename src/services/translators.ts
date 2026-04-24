import { formatCurrencyFromCent, formatSpec, formatStorage } from '@/utils/format';
import type {
  AccountBalanceSummary,
  CloudDashboardListResult,
  CloudDashboardInstanceItem,
  CvmListItem,
  DashboardStats,
  DomainDashboardInstanceItem,
  DomainDashboardListResult,
  DatabaseDashboardInstanceItem,
  DatabaseDashboardListResult,
  DatabaseListItem,
  TencentAccountBalanceResponse,
  TencentCvmResponse,
  TencentDbResponse,
} from './types';

const CVM_STATUS_MAP: Record<string, string> = {
  RUNNING: '运行中',
  SHUTDOWN: '已关机',
  STOPPED: '已停止',
  PENDING: '启动中',
  STARTING: '启动中',
  STOPPING: '关机中',
  REBOOTING: '重启中',
  LAUNCH_FAILED: '启动失败',
  TERMINATING: '销毁中',
};

const DB_STATUS_MAP: Record<string, string> = {
  '1': '运行中',
  RUNNING: '运行中',
  PENDING: '创建中',
  ISOLATED: '隔离中',
  applying: '申请中',
  init: '待初始化',
  initing: '初始化中',
  running: '运行中',
  'limited run': '受限运行',
  limitedrun: '受限运行',
  isolating: '隔离中',
  isolated: '已隔离',
  disisolating: '解隔离中',
  recycling: '回收中',
  recycled: '已回收',
  'job running': '任务执行中',
  jobrunning: '任务执行中',
  offline: '下线',
  migrating: '迁移中',
  expanding: '变配中',
  waitSwitch: '等待切换',
  waitswitch: '等待切换',
  switching: '切换中',
  readonly: '只读',
  restarting: '重启中',
  'network changing': '网络变更中',
  networkchanging: '网络变更中',
  upgrading: '内核版本升级中',
  'audit-switching': '审计状态变更中',
  'primary-switching': '主备切换中',
  offlining: '下线中',
  'deployment changing': '可用区变更中',
  deploymentchanging: '可用区变更中',
  cloning: '恢复数据中',
  'parameter modifying': '参数修改中',
  parametermodifying: '参数修改中',
  'log-switching': '日志状态变更中',
  restoring: '恢复中',
};

const CHARGE_TYPE_MAP: Record<string, string> = {
  PREPAID: '包年包月',
  POSTPAID_BY_HOUR: '按量计费',
};
const EXPIRING_SOON_DAYS = 30;
const DOMAIN_AUTO_RENEW_MAP: Record<string, string> = {
  '0': '未设置',
  '1': '已开启',
  '2': '已关闭',
};

const DOMAIN_BUY_STATUS_MAP: Record<string, string> = {
  ok: '正常',
  AboutToExpire: '即将到期',
  RegisterPending: '注册中',
  RegisterDoing: '注册中',
  RegisterFailed: '注册失败',
  RenewPending: '续费期',
  RenewDoing: '续费中',
  RedemptionPending: '赎回期',
  RedemptionDoing: '赎回中',
  TransferPending: '转入中',
  TransferTransing: '转入中',
  TransferFailed: '转入失败',
};

const CERTIFICATE_STATUS_MAP: Record<string, string> = {
  '0': '审核中',
  '1': '已通过',
  '2': '审核失败',
  '3': '已过期',
  '4': '自动添加 DNS 记录',
  '5': '企业证书待提交资料',
  '6': '订单取消中',
  '7': '已取消',
  '8': '已提交资料，待上传确认函',
  '9': '证书吊销中',
  '10': '已吊销',
  '11': '重颁发中',
  '12': '待上传吊销确认函',
  '13': '免费证书待提交资料',
  '14': '证书已退款',
  '15': '证书迁移中',
};

function normalizeStatusKey(status?: string): string {
  return status?.trim() ?? '';
}

function getStatusLabel(status: string, map: Record<string, string>): string {
  const normalized = normalizeStatusKey(status);
  return map[normalized] ?? map[normalized.toLowerCase()] ?? normalized;
}

function isRunningStatus(statusCode: string): boolean {
  const normalized = normalizeStatusKey(statusCode).toLowerCase();
  return normalized === 'running' || normalized === '1';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getField<T = unknown>(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }

  return undefined;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  const value = getField(record, keys);
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  const value = getField(record, keys);

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  const value = getField(record, keys);

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return undefined;
}

function readStringArray(record: Record<string, unknown>, keys: string[]) {
  const value = getField(record, keys);
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractNestedPayload(payload: unknown): unknown {
  const record = asRecord(payload);
  if (!record) {
    return payload;
  }

  const nested = getField(record, ['Data', 'data', 'Response', 'response']);
  if (nested === undefined || nested === payload) {
    return payload;
  }

  return extractNestedPayload(nested);
}

function extractListPayload(payload: unknown): { list: unknown[]; total?: number } {
  if (Array.isArray(payload)) {
    return { list: payload, total: payload.length };
  }

  const record = asRecord(payload);
  if (!record) {
    return { list: [] };
  }

  const directList = getField<unknown>(record, ['List', 'list', 'Rows', 'rows', 'Items', 'items']);
  if (Array.isArray(directList)) {
    return {
      list: directList,
      total: readNumber(record, ['Total', 'total', 'Count', 'count']),
    };
  }

  const nested = getField<unknown>(record, ['Data', 'data', 'Response', 'response']);
  if (nested !== undefined) {
    return extractListPayload(nested);
  }

  return { list: [] };
}

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

function formatCloudDashboardSpec(instance: Record<string, unknown>): string {
  const segments: string[] = [];
  const cpu = readNumber(instance, ['CPU', 'cpu']);
  const memory = readNumber(instance, ['Memory', 'memory']);
  const diskType = readString(instance, ['DiskType', 'diskType']);
  const diskSize = readString(instance, ['DiskSize', 'diskSize']);
  const bandwidth = readNumber(instance, ['InternetMaxBandwidthOut', 'internetMaxBandwidthOut']);
  const cpuText = cpu === undefined ? '--' : String(cpu);
  const memoryText = memory === undefined ? '--' : String(memory);

  if (cpu !== undefined || memory !== undefined) {
    segments.push(`${cpuText} 核 / ${memoryText} GB`);
  }

  if (diskType || diskSize) {
    segments.push([diskType, diskSize].filter(Boolean).join(' / '));
  }

  if (bandwidth !== undefined) {
    segments.push(`${bandwidth} Mbps`);
  }

  return segments.join(' · ') || '--';
}

function normalizeCloudDashboardStatus(status?: string): CloudDashboardInstanceItem['status'] {
  if (!status) {
    return '未知';
  }

  return CVM_STATUS_MAP[status] ?? status;
}

function normalizeChargeType(chargeType?: string): string {
  if (!chargeType) {
    return '--';
  }

  return CHARGE_TYPE_MAP[chargeType] ?? chargeType;
}

export function translateCloudDashboardList(
  response: unknown,
): CloudDashboardListResult {
  const { list: sourceList, total } = extractListPayload(response);

  const list = sourceList.map((rawInstance, index) => {
    const instance = asRecord(rawInstance) ?? {};
    const numericAccountId = readNumber(instance, ['AccountId', 'accountId']);
    const accountId =
      readString(instance, ['AccountUuid', 'accountUuid', 'AccountUUID', 'accountUUID']) ||
      (numericAccountId !== undefined
        ? String(numericAccountId)
        : '');
    const id = readString(instance, ['InstanceID', 'instanceId', 'InstanceId', 'instanceID']) || '--';
    const accountName = readString(instance, ['AccountName', 'accountName']);
    const statusCode = readString(instance, ['InstanceState', 'instanceState']) || 'UNKNOWN';
    const publicIp =
      readString(instance, ['PublicIpAddresses', 'publicIpAddresses', 'PublicIpAddress', 'publicIpAddress']) ||
      readStringArray(instance, ['PublicIpAddresses', 'publicIpAddresses'])[0] ||
      '--';
    const privateIp =
      readString(instance, ['PrivateIpAddresses', 'privateIpAddresses', 'PrivateIpAddress', 'privateIpAddress']) ||
      readStringArray(instance, ['PrivateIpAddresses', 'privateIpAddresses'])[0] ||
      '--';

    return {
      rowId: `${accountId || 'unknown'}:${id || index}`,
      accountId,
      account: accountName || accountId || '--',
      id,
      name: readString(instance, ['InstanceName', 'instanceName']) || '--',
      status: normalizeCloudDashboardStatus(statusCode),
      statusCode,
      publicIp,
      privateIp,
      spec: formatCloudDashboardSpec(instance),
      zone: readString(instance, ['Zone', 'zone']) || '--',
      chargeType: normalizeChargeType(readString(instance, ['InstanceChargeType', 'instanceChargeType'])),
      expiredTime: readString(instance, ['ExpiredTime', 'expiredTime']),
      remark: readString(instance, ['Remark', 'remark']) || '--',
    };
  });

  return {
    list,
    total: total ?? list.length,
  };
}

export function translateDatabaseList(response: TencentDbResponse): DatabaseListItem[] {
  return response.Response.DBInstanceSet.map((instance) => ({
    id: instance.InstanceId,
    name: instance.InstanceName,
    type: instance.DBInstanceType,
    status: getStatusLabel(instance.Status, DB_STATUS_MAP),
    statusCode: instance.Status,
    address: `${instance.Vip}:${instance.Vport}`,
    storage: formatStorage(instance.Volume),
    createdAt: instance.CreateTime,
  }));
}

function normalizeDatabaseDashboardStatus(status?: string): DatabaseDashboardInstanceItem['status'] {
  if (!status) {
    return '未知';
  }

  return getStatusLabel(status, DB_STATUS_MAP);
}

function normalizeDatabaseDashboardType(instance: Record<string, unknown>): string {
  return readString(instance, ['DataBaseType', 'databaseType', 'DBInstanceType', 'dbInstanceType']) || '--';
}

export function translateDatabaseDashboardList(
  response: unknown,
): DatabaseDashboardListResult {
  const { list: sourceList, total } = extractListPayload(response);

  const list = sourceList.map((rawInstance, index) => {
    const instance = asRecord(rawInstance) ?? {};
    const numericAccountId = readNumber(instance, ['AccountId', 'accountId']);
    const volume = readNumber(instance, ['Volume', 'volume']);
    const accountId =
      readString(instance, ['AccountUuid', 'accountUuid', 'AccountUUID', 'accountUUID']) ||
      (numericAccountId !== undefined
        ? String(numericAccountId)
        : '');
    const id = readString(instance, ['InstanceID', 'instanceId', 'InstanceId', 'instanceID']) || '--';
    const accountName = readString(instance, ['AccountName', 'accountName']);
    const statusCode =
      readString(instance, ['InstanceState', 'instanceState', 'Status', 'status']) ||
      String(readNumber(instance, ['InstanceState', 'instanceState', 'Status', 'status']) ?? 'UNKNOWN');
    const publicIp =
      readString(instance, ['PublicIpAddresses', 'publicIpAddresses', 'PublicIpAddress', 'publicIpAddress']) ||
      readStringArray(instance, ['PublicIpAddresses', 'publicIpAddresses'])[0] ||
      '--';
    const privateIp =
      readString(instance, ['PrivateIpAddresses', 'privateIpAddresses', 'PrivateIpAddress', 'privateIpAddress']) ||
      readStringArray(instance, ['PrivateIpAddresses', 'privateIpAddresses'])[0] ||
      '--';

    return {
      rowId: `${accountId || 'unknown'}:${id || index}`,
      accountId,
      account: accountName || accountId || '--',
      id,
      name: readString(instance, ['InstanceName', 'instanceName']) || '--',
      type: normalizeDatabaseDashboardType(instance),
      status: normalizeDatabaseDashboardStatus(statusCode),
      statusCode,
      publicIp,
      privateIp,
      storage: readString(instance, ['DiskSize', 'diskSize']) || (volume !== undefined ? formatStorage(volume) : '--'),
      zone: readString(instance, ['Zone', 'zone']) || '--',
      chargeType: normalizeChargeType(readString(instance, ['InstanceChargeType', 'instanceChargeType'])),
      expiredTime: readString(instance, ['ExpiredTime', 'expiredTime']),
    };
  });

  return {
    list,
    total: total ?? list.length,
  };
}

function normalizeDomainAutoRenew(autoRenew?: number | string): DomainDashboardInstanceItem['autoRenew'] {
  if (autoRenew === undefined || autoRenew === null || autoRenew === '') {
    return '--';
  }

  return DOMAIN_AUTO_RENEW_MAP[String(autoRenew)] ?? String(autoRenew);
}

function normalizeDomainBuyStatus(status?: string): string {
  if (!status) {
    return '--';
  }

  return DOMAIN_BUY_STATUS_MAP[status] ?? DOMAIN_BUY_STATUS_MAP[status.toLowerCase()] ?? status;
}

function normalizeCertificateStatus(statusCode: string, statusName?: string): string {
  if (statusName) {
    return statusName;
  }

  return CERTIFICATE_STATUS_MAP[statusCode] ?? (statusCode || '--');
}

function normalizeBooleanLabel(
  value: boolean | undefined,
  trueLabel = '是',
  falseLabel = '否',
): string {
  if (value === undefined) {
    return '--';
  }

  return value ? trueLabel : falseLabel;
}

export function translateDomainDashboardList(
  response: unknown,
): DomainDashboardListResult {
  const { list: sourceList, total } = extractListPayload(response);

  const list = sourceList.map((rawInstance, index) => {
    const instance = asRecord(rawInstance) ?? {};
    const numericAccountId = readNumber(instance, ['AccountId', 'accountId']);
    const accountId =
      readString(instance, ['AccountUuid', 'accountUuid', 'AccountUUID', 'accountUUID']) ||
      (numericAccountId !== undefined
        ? String(numericAccountId)
        : '');
    const domainId = readString(instance, ['DomainId', 'domainId']) || '--';
    const domainName = readString(instance, ['DomainName', 'domainName']) || '--';
    const accountName = readString(instance, ['AccountName', 'accountName']);
    const buyStatusCode = readString(instance, ['BuyStatus', 'buyStatus']) || '';
    const autoRenewCode = String(readNumber(instance, ['AutoRenew', 'autoRenew']) ?? '');
    const isPremium = readBoolean(instance, ['IsPremium', 'isPremium']);
    const deployable = readBoolean(instance, ['Deployable', 'deployable']);
    const certificateStatusCode = String(readNumber(instance, ['Status', 'status']) ?? '');
    const certificateStatus = normalizeCertificateStatus(
      certificateStatusCode,
      readString(instance, ['StatusName', 'statusName']),
    );

    return {
      rowId: `${accountId || 'unknown'}:${domainId || domainName || index}`,
      accountId,
      account: accountName || accountId || '--',
      domain: readString(instance, ['Domain', 'domain']) || '--',
      domainId,
      domainName,
      buyStatus: normalizeDomainBuyStatus(buyStatusCode),
      buyStatusCode,
      autoRenew: normalizeDomainAutoRenew(autoRenewCode),
      autoRenewCode,
      certificateId: readString(instance, ['CertificateId', 'certificateId']) || '--',
      certificateName: readString(instance, ['CertificateName', 'certificateName']) || '--',
      certificateType: readString(instance, ['CertificateType', 'certificateType']) || '--',
      certificateStatus,
      certificateStatusCode,
      productZhName: readString(instance, ['ProductZhName', 'productZhName']) || '--',
      subjectAltName: readStringArray(instance, ['SubjectAltName', 'subjectAltName']),
      validityPeriod: readString(instance, ['ValidityPeriod', 'validityPeriod']) || '--',
      deployable: normalizeBooleanLabel(deployable, '可部署', '不可部署'),
      certBeginTime: readString(instance, ['CertBeginTime', 'certBeginTime']),
      certEndTime: readString(instance, ['CertEndTime', 'certEndTime']),
      tld: readString(instance, ['Tld', 'tld']) || '--',
      codeTld: readString(instance, ['CodeTld', 'codeTld']) || '--',
      parentDomainName: readString(instance, ['ParentDomainName', 'parentDomainName']) || '--',
      isPremium: normalizeBooleanLabel(isPremium),
      creationDate: readString(instance, ['CreationDate', 'creationDate']),
      expirationDate: readString(instance, ['ExpirationDate', 'expirationDate']),
    };
  });

  return {
    list,
    total: total ?? list.length,
  };
}

export function buildDashboardStats(
  cvmList: Array<{ statusCode: string; expiredTime?: string }>,
  databaseList: Array<{ statusCode: string; expiredTime?: string }>,
  domainList: Array<{ expirationDate?: string }>,
): DashboardStats {
  const runningCount =
    cvmList.filter((item) => item.statusCode === 'RUNNING').length +
    databaseList.filter((item) => isRunningStatus(item.statusCode)).length;

  const abnormalCount =
    cvmList.filter((item) => item.statusCode !== 'RUNNING').length +
    databaseList.filter((item) => !isRunningStatus(item.statusCode)).length;

  const expiringSoonCount =
    cvmList.filter((item) => isExpiringSoon(item.expiredTime)).length +
    databaseList.filter((item) => isExpiringSoon(item.expiredTime)).length +
    domainList.filter((item) => isExpiringSoon(item.expirationDate)).length;

  return {
    cvmTotal: cvmList.length,
    databaseTotal: databaseList.length,
    domainTotal: domainList.length,
    runningCount,
    abnormalCount,
    expiringSoonCount,
  };
}

function isExpiringSoon(expiredTime?: string): boolean {
  if (!expiredTime) {
    return false;
  }

  const targetDate = new Date(expiredTime);
  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  const today = new Date();
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayDiff = Math.round((targetDay.getTime() - todayDay.getTime()) / (24 * 60 * 60 * 1000));

  return dayDiff <= EXPIRING_SOON_DAYS;
}

export function translateAccountBalance(
  response: TencentAccountBalanceResponse,
): AccountBalanceSummary {
  const payload = extractNestedPayload(response);
  const record = asRecord(payload) ?? {};
  const tempAmountInfoList = getField<unknown>(record, ['TempAmountInfoList', 'tempAmountInfoList']);
  const tempItems = Array.isArray(tempAmountInfoList) ? tempAmountInfoList : [];

  return {
    uin: String(readNumber(record, ['Uin', 'uin']) ?? '--'),
    availableBalance: formatCurrencyFromCent(readNumber(record, ['Balance', 'balance']) ?? 0),
    cashBalance: formatCurrencyFromCent(readNumber(record, ['CashAccountBalance', 'cashAccountBalance']) ?? 0),
    incomeBalance: formatCurrencyFromCent(readNumber(record, ['IncomeIntoAccountBalance', 'incomeIntoAccountBalance']) ?? 0),
    presentBalance: formatCurrencyFromCent(readNumber(record, ['PresentAccountBalance', 'presentAccountBalance']) ?? 0),
    freezeAmount: formatCurrencyFromCent(readNumber(record, ['FreezeAmount', 'freezeAmount']) ?? 0),
    oweAmount: formatCurrencyFromCent(readNumber(record, ['OweAmount', 'oweAmount']) ?? 0),
    creditAmount: formatCurrencyFromCent(readNumber(record, ['CreditAmount', 'creditAmount']) ?? 0),
    creditBalance: formatCurrencyFromCent(readNumber(record, ['CreditBalance', 'creditBalance']) ?? 0),
    realCreditBalance: formatCurrencyFromCent(readNumber(record, ['RealCreditBalance', 'realCreditBalance']) ?? 0),
    tempCredit: formatCurrencyFromCent(readNumber(record, ['TempCredit', 'tempCredit']) ?? 0),
    tempAmountInfoList: tempItems.map((item) => {
      const tempRecord = asRecord(item) ?? {};

      return {
        uin: readString(tempRecord, ['Uin', 'uin']) || '--',
        tempAmount: formatCurrencyFromCent(readNumber(tempRecord, ['TempAmount', 'tempAmount']) ?? 0),
        startTime: readString(tempRecord, ['StartTime', 'startTime']),
        endTime: readString(tempRecord, ['EndTime', 'endTime']),
      };
    }),
  };
}

export function normalizeAccountBalanceResponse(response: unknown): TencentAccountBalanceResponse {
  const payload = extractNestedPayload(response);
  const record = asRecord(payload) ?? {};
  const tempAmountInfoList = getField<unknown>(record, ['TempAmountInfoList', 'tempAmountInfoList']);
  const tempItems = Array.isArray(tempAmountInfoList) ? tempAmountInfoList : [];

  return {
    Response: {
      Balance: readNumber(record, ['Balance', 'balance']) ?? 0,
      Uin: readNumber(record, ['Uin', 'uin']) ?? 0,
      RealBalance: readNumber(record, ['RealBalance', 'realBalance']) ?? 0,
      CashAccountBalance: readNumber(record, ['CashAccountBalance', 'cashAccountBalance']) ?? 0,
      IncomeIntoAccountBalance: readNumber(record, ['IncomeIntoAccountBalance', 'incomeIntoAccountBalance']) ?? 0,
      PresentAccountBalance: readNumber(record, ['PresentAccountBalance', 'presentAccountBalance']) ?? 0,
      FreezeAmount: readNumber(record, ['FreezeAmount', 'freezeAmount']) ?? 0,
      OweAmount: readNumber(record, ['OweAmount', 'oweAmount']) ?? 0,
      CreditAmount: readNumber(record, ['CreditAmount', 'creditAmount']) ?? 0,
      CreditBalance: readNumber(record, ['CreditBalance', 'creditBalance']) ?? 0,
      RealCreditBalance: readNumber(record, ['RealCreditBalance', 'realCreditBalance']) ?? 0,
      TempCredit: readNumber(record, ['TempCredit', 'tempCredit']) ?? 0,
      RequestId: readString(record, ['RequestId', 'requestId']),
      IsAllowArrears: getField<boolean>(record, ['IsAllowArrears', 'isAllowArrears']),
      IsCreditLimited: getField<boolean>(record, ['IsCreditLimited', 'isCreditLimited']),
      TempAmountInfoList: tempItems.map((item) => {
        const tempRecord = asRecord(item) ?? {};

        return {
          Uin: readString(tempRecord, ['Uin', 'uin']),
          TempAmount: readNumber(tempRecord, ['TempAmount', 'tempAmount']) ?? 0,
          StartTime: readString(tempRecord, ['StartTime', 'startTime']),
          EndTime: readString(tempRecord, ['EndTime', 'endTime']),
        };
      }),
    },
  };
}
