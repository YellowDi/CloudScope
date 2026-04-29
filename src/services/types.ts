export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  Token?: string;
  token?: string | LoginTokenPayload;
  user?: AuthUser;
  data?: LoginTokenPayload & {
    token?: string | LoginTokenPayload;
    user?: AuthUser;
  };
  msg?: string;
  message?: string;
}

export interface LoginTokenPayload {
  Token?: string;
  token?: string | LoginTokenPayload;
}

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
  secretId: string;
  secretKey: string;
}

export interface UpdateAccountPayload {
  id: number;
  name: string;
  region: string;
  status: number;
}

export interface SubAccount {
  id: string;
  recordId?: number;
  displayName: string;
  name: string;
  uin?: string;
  tencentAccountName: string;
  tencentAccountUin?: string;
  tencentAccountUuid?: string;
}

export interface CreateSubAccountPayload {
  password: string;
  status?: number;
  subAccountName: string;
  tencentAccountName: string;
  tencentAccountUin?: number;
  tencentAccountUuid?: string;
}

export interface UpdateSubAccountPayload {
  id: number;
  password?: string;
  status?: number;
  subAccountName?: string;
}

export interface DeleteSubAccountPayload {
  id: number;
  subAccountName: string;
}

export interface QuickLoginSubAccountPayload {
  subAccountName: string;
  tencentAccountUin: number;
}

export interface SubAccountQuickLoginResult {
  loginUrl: string;
  password: string;
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

export interface SubAccountListItem {
  Id?: number;
  SubAccountDisplayName?: string;
  SubAccountName?: string;
  SubAccountUin?: number;
  TencentAccountName?: string;
  TencentAccountUin?: number;
  TencentAccountUuid?: string;
}

export interface SubAccountListResponse {
  List?: SubAccountListItem[];
  Total?: number;
}

export interface SubAccountQuickLoginResponse {
  LoginURL?: string;
  Password?: string;
}

export interface CloudInstanceListReq {
  AccountUUID?: string;
  Full?: boolean;
  Keyword?: CloudInstanceKeyword;
  PageNum?: number;
  PageSize?: number;
}

export interface CloudInstanceKeyword {
  CloudConfiguration?: CloudConfiguration;
  InstanceID?: string;
  InstanceName?: string;
  PrivateIpAddresses?: string;
  PublicIpAddresses?: string;
}

export interface CloudConfiguration {
  CPU?: number;
  DiskSize?: string;
  DiskType?: string;
  InternetMaxBandwidthOut?: number;
  Memory?: number;
}

export interface CloudInstanceListResponse {
  List?: CloudInstanceRow[];
  Total?: number;
  [property: string]: unknown;
}

export interface CloudInstanceRow {
  /** 所属账号 Id */
  AccountId?: number;
  /** 所属账户名称 */
  AccountName?: string;
  /** 所属账号 Uuid */
  AccountUuid?: string;
  /** CPU 核数 */
  CPU?: number;
  /** 系统盘大小 */
  DiskSize?: string;
  /** 硬盘类型 */
  DiskType?: string;
  /** 到期时间 */
  ExpiredTime?: string;
  /** 计费模式 */
  InstanceChargeType?: string;
  /** 实例 ID */
  InstanceID?: string;
  /** 实例名称 */
  InstanceName?: string;
  /** 实例状态 */
  InstanceState?: string;
  /** 公网出带宽上限 */
  InternetMaxBandwidthOut?: number;
  /** 内存，GiB */
  Memory?: number;
  /** 内网 IP */
  PrivateIpAddresses?: string;
  /** 外网 IP */
  PublicIpAddresses?: string;
  /** 备注 */
  Remark?: string;
  /** 可用区 */
  Zone?: string;
  [property: string]: unknown;
}

export interface TencentCvmInstance {
  InstanceId: string;
  InstanceName: string;
  InstanceState:
    | 'RUNNING'
    | 'SHUTDOWN'
    | 'STOPPED'
    | 'PENDING'
    | 'STARTING'
    | 'STOPPING'
    | 'REBOOTING'
    | 'LAUNCH_FAILED'
    | 'TERMINATING';
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

export interface CloudDashboardInstanceItem {
  rowId: string;
  accountId: string;
  account: string;
  id: string;
  name: string;
  status: string;
  statusCode: string;
  publicIp: string;
  privateIp: string;
  spec: string;
  zone: string;
  chargeType: string;
  expiredTime: string;
  remark: string;
}

export interface CloudDashboardListResult {
  list: CloudDashboardInstanceItem[];
  total: number;
}

export interface DashboardListReq {
  AccountUUID?: string;
  Full?: boolean;
  PageNum?: number;
  PageSize?: number;
}

export interface DomainListReq {
  AccountName?: string;
  AccountUUID?: string;
  Full?: boolean;
  PageNum?: number;
  PageSize?: number;
}

export interface DatabaseDashboardInstanceRow {
  AccountId?: number;
  AccountName?: string;
  AccountUuid?: string;
  /** 数据库类型: MySQL/PostgreSQL/Redis/SQLServer/MongoDB/CynosDB 等 */
  DataBaseType?: string;
  /** 存储大小，如 50GB / 200GB */
  DiskSize?: string;
  ExpiredTime?: string;
  InstanceChargeType?: string;
  InstanceID?: string;
  InstanceName?: string;
  /** 后端数据库实例状态码，前端展示时映射为中文 */
  InstanceState?: string;
  Status?: number | string;
  PrivateIpAddresses?: string;
  PublicIpAddresses?: string;
  Zone?: string;
  [property: string]: unknown;
}

export interface DatabaseDashboardListResponse {
  List?: DatabaseDashboardInstanceRow[];
  Total?: number;
}

export interface DatabaseDashboardInstanceItem {
  rowId: string;
  accountId: string;
  account: string;
  id: string;
  name: string;
  type: string;
  status: string;
  statusCode: string;
  publicIp: string;
  privateIp: string;
  storage: string;
  zone: string;
  chargeType: string;
  expiredTime: string;
}

export interface DatabaseDashboardListResult {
  list: DatabaseDashboardInstanceItem[];
  total: number;
}

export interface DomainDashboardInstanceRow {
  /** 域名所属账号 Id，API 文档里是 AppId */
  AccountId?: number;
  /** 域名所属账户名称 */
  AccountName?: string;
  /** 域名所属账号 Uuid */
  AccountUuid?: string;
  /** 是否已设置自动续费，0：未设置；1：已设置；2：设置后关闭 */
  AutoRenew?: number;
  /** 域名购买状态 */
  BuyStatus?: string;
  /** 证书生效时间 */
  CertBeginTime?: string;
  /** 证书过期时间 */
  CertEndTime?: string;
  /** 证书 ID */
  CertificateId?: string;
  /** 证书名称，对应备注名 Alias */
  CertificateName?: string;
  /** 证书类型 */
  CertificateType?: string;
  /** 编码后的后缀 */
  CodeTld?: string;
  /** 域名注册时间 */
  CreationDate?: string;
  /** 是否可部署 */
  Deployable?: boolean;
  /** 主绑定域名 */
  Domain?: string;
  /** 域名资源 ID */
  DomainId?: string;
  /** 域名名称 */
  DomainName?: string;
  /** 域名到期时间 */
  ExpirationDate?: string;
  /** 是否是溢价域名 */
  IsPremium?: boolean;
  /** 所属主域名，主域名本身为空，子域名填写它归属的主域名 */
  ParentDomainName?: string;
  /** 证书品牌/签发方 */
  ProductZhName?: string;
  /** 证书状态码 */
  Status?: number;
  /** 证书状态名称 */
  StatusName?: string;
  /** 绑定的其他域名 */
  SubjectAltName?: string[];
  /** 域名后缀 */
  Tld?: string;
  /** 证书有效期，单位（月） */
  ValidityPeriod?: string;
  [property: string]: unknown;
}

export interface DomainDashboardListResponse {
  /** 域名信息列表 */
  List?: DomainDashboardInstanceRow[];
  Total?: number;
  [property: string]: unknown;
}

export interface DomainDashboardInstanceItem {
  rowId: string;
  accountId: string;
  account: string;
  domain: string;
  domainId: string;
  domainName: string;
  buyStatus: string;
  buyStatusCode: string;
  autoRenew: string;
  autoRenewCode: string;
  certificateId: string;
  certificateName: string;
  certificateType: string;
  certificateStatus: string;
  certificateStatusCode: string;
  productZhName: string;
  subjectAltName: string[];
  validityPeriod: string;
  deployable: string;
  certBeginTime: string;
  certEndTime: string;
  tld: string;
  codeTld: string;
  parentDomainName: string;
  isPremium: string;
  creationDate: string;
  expirationDate: string;
}

export interface DomainDashboardListResult {
  list: DomainDashboardInstanceItem[];
  total: number;
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
  domainTotal: number;
  runningCount: number;
  abnormalCount: number;
  expiringSoonCount: number;
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
