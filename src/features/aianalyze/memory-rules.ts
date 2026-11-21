import type { Check, MemoryModule, MemorySetup } from "./types";

export const MEMORY_POLL_MS = 30000;

// Windows supplies installed labels, not the physical order of unnamed slots.
export function memorySlots(memory: MemorySetup): (MemoryModule | null)[] {
  const count = Math.max(memory.modules.length, memory.totalSlots ?? memory.modules.length);
  return [...memory.modules, ...Array.from({ length: count - memory.modules.length }, () => null)];
}

export function memorySpeed(module: MemoryModule) {
  return {
    configured: module.configuredSpeedMts === null ? "–" : `${module.configuredSpeedMts} MT/s`,
    reported: module.ratedSpeedMts !== null && module.configuredSpeedMts !== null && module.ratedSpeedMts > module.configuredSpeedMts
      ? `reports ${module.ratedSpeedMts}` : null,
  };
}

export function memoryChannelTone(module: MemoryModule, modules: MemoryModule[]) {
  if (module.channel === null) return "unknown";
  const channels = [...new Set(modules.map(item => item.channel).filter(channel => channel !== null))];
  return `channel-${channels.indexOf(module.channel) % 3}`;
}

export function withMemoryCheck(checks: Check[], memory: MemorySetup | null): Check[] {
  if (!memory || checks.some(check => check.id === memory.check.id)) return checks;
  return [...checks, memory.check];
}