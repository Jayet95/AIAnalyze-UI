import sampleData from "./ui-fixtures.json";
import coolingSamples from "./cooling-fixtures.json";
import memorySamples from "./memory-fixtures.json";
import type { Cooling, Health, MemorySetup, Message, Status } from "./types";
import { parseSseEvent, validChat } from "./rules";
export const fixtures = { ...sampleData, "/api/cooling": coolingSamples["/api/cooling"], "/api/memory": memorySamples["/api/memory"] };
export class LocalApi {
  mock = false;
  async initialize(forceMock: boolean) {
    this.mock = forceMock;
    if (!forceMock) {
      try {
        return await this.get<Status>("/api/status");
      } catch {
        this.mock = true;
      }
    }
    return structuredClone(fixtures["/api/status"]) as Status;
  }
  async get<T>(path: string): Promise<T> {
    if (this.mock) {
      const p = path.split("?")[0] || path;
      const records: Record<string, unknown> = fixtures;
      const data =
        p === "/api/alerts"
          ? fixtures["/api/alerts?after=0"].filter(
              (a) => a.id > Number(new URLSearchParams(path.split("?")[1]).get("after") || 0),
            )
          : (records[path] ?? records[p]);
      if (data === null || data === undefined)
        throw new Error("No measurements are available yet.");
      return structuredClone(data) as T;
    }
    const response = await fetch(path, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok)
      throw new Error(
        response.status === 404
          ? "No measurements are available yet."
          : "AIAnalyze service isn't running. Start it from Services, or reinstall.",
      );
    return response.json() as Promise<T>;
  }
  async check() {
    if (this.mock) {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      fixtures["/api/health"].report &&
        (fixtures["/api/health"].report.atUtc = new Date().toISOString());
      return;
    }
    const response = await fetch("/api/health/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) throw new Error("The health check could not start. Please try again.");
  }
  async cooling(): Promise<Cooling | null> {
    if (this.mock) return this.get<Cooling>("/api/cooling");
    const response = await fetch("/api/cooling", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (response.status === 503) return null;
    if (!response.ok) throw new Error("Cooling readings are temporarily unavailable.");
    return response.json() as Promise<Cooling>;
  }
  async memory(): Promise<MemorySetup | null> {
    if (this.mock) return this.get<MemorySetup>("/api/memory");
    const response = await fetch("/api/memory", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (response.status === 503) return null;
    if (!response.ok) throw new Error("Memory setup is temporarily unavailable.");
    return response.json() as Promise<MemorySetup>;
  }
  async chat(
    messages: Message[],
    sessionId: number | null,
    signal: AbortSignal,
    append: (text: string) => void,
  ) {
    if (!validChat(messages))
      throw new Error(
        "Send up to 20 messages, each between 1 and 4,000 characters, ending with your question.",
      );
    if (this.mock) {
      for (const raw of fixtures["POST /api/chat (event stream)"]) {
        if (signal.aborted) return;
        const event = parseSseEvent(raw);
        if (event?.text) {
          await new Promise((r) => setTimeout(r, 250));
          if (!signal.aborted) append(event.text);
        }
      }
      return;
    }
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, sessionId }),
      signal,
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error || "The assistant could not answer.");
    }
    if (!response.body) throw new Error("No answer was received.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    try {
      while (!done) {
        const chunk = await reader.read();
        buffer = (buffer + decoder.decode(chunk.value, { stream: !chunk.done })).replace(
          /\r\n/g,
          "\n",
        );
        let boundary = buffer.indexOf("\n\n");
        while (boundary >= 0) {
          const event = parseSseEvent(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          if (event?.error) throw new Error(event.error);
          if (event?.text) append(event.text);
          if (event?.done) {
            done = true;
            break;
          }
          boundary = buffer.indexOf("\n\n");
        }
        if (chunk.done) {
          if (!done) throw new Error("The answer was interrupted. Please try again.");
          break;
        }
      }
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
  }
}
export type { Health };
