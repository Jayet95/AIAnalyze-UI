import type { Cooling, Live, Specs } from "./types";
import { fanMotion } from "./cooling-rules";

export function isIntegratedGraphics(name: string) {
  return /\b(uhd|iris|integrated|radeon\s+graphics|radeon\s+\d{3}m|intel.*graphics)\b/i.test(name);
}

export function hardwareProfile(specs: Specs) {
  const gpu = specs.gpus.find((item) => !isIntegratedGraphics(item.name) && !/basic display|remote display/i.test(item.name));
  const integrated = specs.gpus.find((item) => isIntegratedGraphics(item.name));
  if (gpu) return { kind: "gpu" as const, name: gpu.name, graphics: gpu };
  if (integrated) return { kind: "apu" as const, name: specs.cpuName, graphics: integrated };
  return { kind: "cpu" as const, name: specs.cpuName, graphics: null };
}

export function hardwareActivity(kind: "gpu" | "apu" | "cpu", live: Live | null) {
  const point = live?.points.at(-1);
  const value = point?.m[kind === "gpu" ? "GPU %" : "CPU %"];
  const load = typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
  return { load, active: load !== null && load > 0, speed: load === null ? "unknown" : load > 65 ? "high" : load > 25 ? "medium" : "low" };
}

export function gpuCoolingState(name: string, cooling: Cooling | null) {
  const gpu = cooling?.gpus.find(item => item.name === name);
  if (!gpu || !Number.isInteger(gpu.fanCount) || gpu.fanCount < 1 || gpu.fanCount > 3) {
    return { kind: "unknown" as const, fans: [], active: false, zeroRpm: false };
  }
  const fans = Array.from({ length: gpu.fanCount }, (_, index) => {
    const fan = gpu.fans[index] ?? { name: `Fan ${index + 1}`, rpm: null, percent: null };
    return { ...fan, ...fanMotion(fan, gpu.zeroRpm) };
  });
  // PC-wide Liquid detection does not identify the GPU as liquid-cooled.
  return { kind: "air" as const, fans, active: fans.some(fan => fan.active), zeroRpm: gpu.zeroRpm };
}