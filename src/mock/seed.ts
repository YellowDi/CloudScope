const REGION_POOL = ['ap-guangzhou', 'ap-shanghai', 'ap-beijing', 'ap-singapore'];
const CVM_NAMES = ['core-api', 'billing-worker', 'ops-gateway', 'data-sync', 'log-agent'];
const DB_NAMES = ['orders-mysql', 'audit-mysql', 'crm-postgres', 'metrics-redis'];
const DB_TYPES = ['MySQL', 'PostgreSQL', 'Redis'];

export function randomDelay() {
  return 320 + Math.floor(Math.random() * 520);
}

export function sleep(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomBoolean(rate = 0.5) {
  return Math.random() < rate;
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createRecentTimestamp(offsetHours: number) {
  return new Date(Date.now() - offsetHours * 60 * 60 * 1000).toISOString();
}

export function randomIpv4(segment: number) {
  return `10.${segment}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

export function randomPublicIpv4() {
  return `139.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

export function randomRegion() {
  return pickRandom(REGION_POOL);
}

export function randomCvmName(index: number) {
  return `${pickRandom(CVM_NAMES)}-${index + 1}`;
}

export function randomDbName(index: number) {
  return `${pickRandom(DB_NAMES)}-${index + 1}`;
}

export function randomDbType() {
  return pickRandom(DB_TYPES);
}
