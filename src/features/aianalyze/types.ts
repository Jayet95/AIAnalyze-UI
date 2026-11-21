export type Severity = "Critical" | "Warning" | "Info" | null;
export type Check = {
  id: string;
  title: string;
  summary: string;
  severity: Severity;
  evidence: string[];
};
export type Program = { name: string; processId: number; cpuPercent: number; memoryMb: number };
export type Report = {
  atUtc: string;
  uptime: string;
  worst: Severity;
  checks: Check[];
  memory: { usedGb: number; totalGb: number; usedPercent: number };
  drives: {
    name: string;
    label: string;
    freeBytes: number;
    totalBytes: number;
    freePercent: number;
  }[];
  topByCpu: Program[];
  topByMemory: Program[];
};
export type Health = { report: Report | null; running: boolean };
export type Status = {
  nowUtc: string;
  lastSampleUtc: string | null;
  capture: {
    state: "Running" | "WaitingForUser" | "Restarting" | "Disabled";
    message: string;
    userSession: boolean;
    lastFrameUtc: string | null;
    currentApplication: string | null;
    lastSessionUtc: string | null;
  };
  database: { path: string; sizeBytes: number };
};
export type Point = { t: number; m: Record<string, number | null> };
export type CoolingFan = { name: string; rpm: number | null; percent: number | null };
export type Cooling = {
  atUtc: string;
  gpus: { name: string; fanCount: number; fans: CoolingFan[]; zeroRpm: boolean }[];
  systemFans: CoolingFan[];
  pumps: CoolingFan[];
  coolingType: "Liquid" | "Air" | "Unknown";
  coolingTypeReason: string;
};
export type Live = { gpu: string; points: Point[] };
export type MemoryModule = {
  slot: string;
  bank: string | null;
  channel: string | null;
  capacityGb: number | null;
  type: string | null;
  ratedSpeedMts: number | null;
  configuredSpeedMts: number | null;
  manufacturer: string | null;
  partNumber: string | null;
};
export type MemorySetup = {
  atUtc: string;
  totalGb: number;
  totalSlots: number | null;
  usedSlots: number;
  modules: MemoryModule[];
  check: Check;
};
export type Session = {
  id: number;
  application: string;
  startUtc: string;
  endUtc: string;
  durationSeconds: number;
  frameCount: number;
  medianFps: number | null;
  worst: Severity;
};
export type SessionDetail = {
  session: Omit<Session, "durationSeconds" | "worst">;
  gpu: string;
  baseline: { kind: string; fps: number | null; message: string };
  feedback: string | null;
  findings: { kind: string; severity: Severity; message: string }[];
  rows: (Point & { fps: number | null })[];
};
export type Alert = {
  id: number;
  atUtc: string;
  kind: string;
  severity: Severity;
  message: string;
  sessionId: number | null;
};
export type Specs = {
  computerManufacturer: string;
  computerModel: string;
  osName: string;
  osVersion: string;
  osBuild: string;
  cpuName: string;
  cpuCores: number;
  cpuLogicalProcessors: number;
  cpuMaxClockMhz: number;
  motherboardManufacturer: string;
  motherboardProduct: string;
  biosVersion: string;
  ramTotalGb: number;
  gpus: { name: string; vramGb: number; driverVersion: string }[];
};
export type Message = { role: "user" | "assistant"; content: string; completed?: boolean };
export type Account = {
  signInConfigured: boolean;
  signedIn: boolean;
  email: string | null;
  name: string | null;
  assistant: "Account" | "ApiKey" | "Off";
  quota: { questionsToday: number; dailyLimit: number } | null;
};
export type ChatStatus = { configured: boolean; mode?: "Off" | "Account" | "ApiKey"; signInAvailable?: boolean };
export type Privacy = { consent: boolean | null; serverConfigured: boolean; preview: { deviceId: string; snapshot: unknown; feedback: unknown[] } };
export type FeedbackVote = { target: "health" | "finding" | "answer"; kind: string; helpful: boolean };
