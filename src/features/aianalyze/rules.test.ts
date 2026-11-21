import { describe, expect, it } from "vitest";
import { captureLabel, isFpsDip, parseSseEvent, temperatureSeverity, validChat } from "./rules";
import { LocalApi } from "./api";
import type { Health, Message, SessionDetail } from "./types";
describe("PC health rules", () => {
  it("warns at 85°C CPU and 83°C GPU, not below", () => {
    expect(temperatureSeverity(84.9)).toBe(null);
    expect(temperatureSeverity(85)).toBe("Warning");
    expect(temperatureSeverity(82.9, true)).toBe(null);
    expect(temperatureSeverity(83, true)).toBe("Warning");
  });
  it("marks 95°C CPU and 93°C GPU as critical", () => {
    expect(temperatureSeverity(94.9)).toBe("Warning");
    expect(temperatureSeverity(95)).toBe("Critical");
    expect(temperatureSeverity(92.9, true)).toBe("Warning");
    expect(temperatureSeverity(93, true)).toBe("Critical");
  });
  it("does not interpret a missing sensor as zero or critical", () => {
    expect(temperatureSeverity(null)).toBe(null);
  });
  it("treats FPS capture disabled as off rather than a broken service", () => {
    expect(captureLabel("Disabled")).toBe("FPS capture off");
  });
  it("requires a final user message", () => {
    expect(validChat([{ role: "assistant", content: "Hello" }])).toBe(false);
    expect(validChat([{ role: "user", content: "Hello" }])).toBe(true);
  });
  it("allows at most 20 messages", () => {
    const messages: Message[] = Array.from({ length: 20 }, () => ({
      role: "user",
      content: "Question",
    }));
    expect(validChat(messages)).toBe(true);
    expect(validChat([...messages, { role: "user", content: "Extra" }])).toBe(false);
  });
  it("enforces 1 to 4000 characters per message", () => {
    expect(validChat([{ role: "user", content: "" }])).toBe(false);
    expect(validChat([{ role: "user", content: "a" }])).toBe(true);
    expect(validChat([{ role: "user", content: "a".repeat(4000) }])).toBe(true);
    expect(validChat([{ role: "user", content: "a".repeat(4001) }])).toBe(false);
  });
  it("highlights only FPS below half the median", () => {
    expect(isFpsDip(43.5, 87)).toBe(false);
    expect(isFpsDip(41, 87)).toBe(true);
    expect(isFpsDip(null, 87)).toBe(false);
  });
  it("parses SSE text, completion and errors", () => {
    expect(parseSseEvent('data: {"text":"שלום"}')).toEqual({ text: "שלום" });
    expect(parseSseEvent('data: {"done":true}')).toEqual({ done: true });
    expect(parseSseEvent('data: {"error":"No API key"}')).toEqual({ error: "No API key" });
  });
  it("preserves the supplied byte-based drives and nested session shape", async () => {
    const api = new LocalApi();
    await api.initialize(true);
    const health = await api.get<Health>("/api/health");
    expect(health.report?.drives[0]?.freeBytes).toBe(76235669504);
    const detail = await api.get<SessionDetail>("/api/sessions/14");
    expect(detail.session.frameCount).toBe(251430);
  });
  it("only returns alerts newer than after", async () => {
    const api = new LocalApi();
    await api.initialize(true);
    expect(await api.get("/api/alerts?after=30")).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 31 })]),
    );
    expect(await api.get("/api/alerts?after=31")).toEqual([]);
  });
});
