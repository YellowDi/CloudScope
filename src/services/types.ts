export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export type AccountStatus = 'connected' | 'error';

export interface CloudAccount {
  id: string;
  name: string;
  region: string;
  status: string;
  statusCode?: number;
  lastSyncedAt: string;
  createdAt?: string;
  updatedAt?: string;
  uuid?: string;
  recordId?: number;
  uin?: string;
  balance?: number;
  cashAccountBalance?: number;
  freezeAmount?: number;
  oweAmount?: number;
  presentAccountBalance?: number;
  credentialConfigured?: boolean;
}

export interface CreateAccountPayload {
  name: string;
  region: string;
}

export interface TencentAccountListRequest {
  Full: boolean;
  PageNum: number;
  PageSize: number;
}

export interface TencentAccountListItem {
  Balance?: number;
  CashAccountBalance?: number;
  CreatedAt?: string;
  FreezeAmount?: number;
  Id?: number;
  Name?: string;
  OweAmount?: number;
  PresentAccountBalance?: number;
  Region?: string;
  Status?: number;
  Uin?: number;
  UpdatedAt?: string;
  Uuid?: string;
}

export interface TencentAccountListResponse {
  List: TencentAccountListItem[];
  Total: number;
}

export interface TencentCvmInstance {
  InstanceId: string;
  InstanceName: string;
  InstanceState: 'RUNNING' | 'STOPPED' | 'PENDING';
  PublicIpAddresses: string[];
  PrivateIpAddresses: string[];
  CPU: number;
  Memory: number;
  CreatedTime: string;
}

export interface TencentCvmResponse {
  Response: {
    TotalCount: number;
    InstanceSet: TencentCvmInstance[];
  };
}

export interface TencentDbInstance {
  InstanceId: string;
  InstanceName: string;
  DBInstanceType: string;
  Status: 'RUNNING' | 'PENDING' | 'ISOLATED';
  Vip: string;
  Vport: number;
  Volume: number;
  CreateTime: string;
}

export interface TencentDbResponse {
  Response: {
    TotalCount: number;
    DBInstanceSet: TencentDbInstance[];
  };
}

export interface TencentTempAmountInfo {
  Uin: string;
  TempAmount: number;
  StartTime: string;
  EndTime: string;
}

export interface TencentAccountBalanceResponse {
  Response: {
    Balance: number;
    Uin: number;
    RealBalance: number;
    CashAccountBalance: number;
    IncomeIntoAccountBalance: number;
    PresentAccountBalance: number;
    FreezeAmount: number;
    OweAmount: number;
    CreditAmount: number;
    CreditBalance: number;
    RealCreditBalance: number;
    TempCredit: number;
    TempAmountInfoList: TencentTempAmountInfo[];
    RequestId: string;
    IsAllowArrears?: boolean;
    IsCreditLimited?: boolean;
  };
}

export interface CvmListItem {
  id: string;
  name: string;
  status: string;
  statusCode: TencentCvmInstance['InstanceState'];
  publicIp: string;
  privateIp: string;
  spec: string;
  createdAt: string;
}

export interface DatabaseListItem {
  id: string;
  name: string;
  type: string;
  status: string;
  statusCode: TencentDbInstance['Status'];
  address: string;
  storage: string;
  createdAt: string;
}

export interface DashboardStats {
  cvmTotal: number;
  databaseTotal: number;
  runningCount: number;
  abnormalCount: number;
}

export interface TempAmountInfoItem {
  uin: string;
  tempAmount: string;
  startTime: string;
  endTime: string;
}

export interface AccountBalanceSummary {
  uin: string;
  availableBalance: string;
  cashBalance: string;
  incomeBalance: string;
  presentBalance: string;
  freezeAmount: string;
  oweAmount: string;
  creditAmount: string;
  creditBalance: string;
  realCreditBalance: string;
  tempCredit: string;
  tempAmountInfoList: TempAmountInfoItem[];
}

export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: Record<string, unknown>) => string | number;
}

export interface RequestOptions<TBody = unknown> {
  path: string;
  method?: 'GET' | 'POST' | 'DELETE';
  body?: TBody;
}
