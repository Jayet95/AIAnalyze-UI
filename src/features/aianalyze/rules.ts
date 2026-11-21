import type { Message, Severity, Status } from "./types";
export function temperatureSeverity(value: number | null, gpu = false): Severity {
  if (value === null) return null;
  if (value >= (gpu ? 93 : 95)) return "Critical";
  if (value >= (gpu ? 83 : 85)) return "Warning";
  return null;
}
export function captureLabel(state: Status["capture"]["state"]) {
  return {
    Running: "Capturing FPS",
    WaitingForUser: "Waiting for sign-in",
    Restarting: "Restarting capture",
    Disabled: "FPS capture off",
  }[state];
}
export function validChat(messages: Message[]) {
  return (
    messages.length > 0 &&
    messages.length <= 20 &&
    messages.at(-1)?.role === "user" &&
    messages.every((m) => m.content.length >= 1 && m.content.length <= 4000)
  );
}
export function isFpsDip(fps: number | null, median: number | null) {
  return fps !== null && median !== null && fps < median / 2;
}
export function parseSseEvent(
  event: string,
): { text?: string; done?: boolean; error?: string } | null {
  const data = event
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n");
  if (!data) return null;
  return JSON.parse(data);
}
export function relativeTime(value: string | null, mock = false) {
  if (!value) return "Waiting for sensors";
  if (mock) return "a moment ago";
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
export function duration(seconds: number) {
  return seconds >= 3600
    ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
    : `${Math.floor(seconds / 60)}m`;
}
