import type { CoolingFan } from "./types";
export const COOLING_POLL_MS = 5000;
export function fanMotion(fan: CoolingFan, stopped = false) {
  const active = !stopped && fan.rpm !== null && Number.isFinite(fan.rpm) && fan.rpm > 0;
  return { active, speed: fan.percent === null ? "low" : fan.percent > 65 ? "high" : fan.percent > 25 ? "medium" : "low" };
}