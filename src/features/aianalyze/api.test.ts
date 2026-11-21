import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalApi } from "./api";
describe("Local service transport", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("treats memory 503 as waiting for a health check", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "First health check pending" }), { status: 503 })));
    expect(await new LocalApi().memory()).toBe(null);
  });
  it("preserves the exact memory response and reads the same-origin endpoint", async () => {
    const api = new LocalApi(); await api.initialize(true);
    const sample = await api.memory();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(sample)));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new LocalApi().memory();
    expect(result).toEqual(sample);
    expect(result?.modules[1]?.slot).toBe("DIMM_B2");
    expect(fetchMock).toHaveBeenCalledWith("/api/memory", expect.objectContaining({ headers: { Accept: "application/json" } }));
  });
  it("treats cooling 503 as waiting, not a service failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Waiting for first reading" }), { status: 503 })));
    expect(await new LocalApi().cooling()).toBe(null);
  });
  it("preserves exact cooling samples including pump and separate GPU fans", async () => {
    const api = new LocalApi(); await api.initialize(true);
    const cooling = await api.cooling();
    expect(cooling?.gpus[0]?.fans[0]?.rpm).toBe(1480);
    expect(cooling?.pumps[0]?.rpm).toBe(2700);
  });
  it("uses relative JSON POST requests and streams split events correctly", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      'data: {"text":"First "}\r',
      "\n\r\n",
      'data: {"text":"second"}\n\n',
      'data: {"done":true}\n\n',
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(c) {
            chunks.forEach((text) => c.enqueue(encoder.encode(text)));
            c.close();
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const api = new LocalApi();
    let answer = "";
    await api.chat(
      [{ role: "user", content: "Explain my session" }],
      14,
      new AbortController().signal,
      (text) => {
        answer += text;
      },
    );
    expect(answer).toBe("First second");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Explain my session" }],
          sessionId: 14,
        }),
      }),
    );
  });
  it("reports pre-stream API key errors without faking an answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ error: "No API key" }), { status: 503 })),
    );
    await expect(
      new LocalApi().chat(
        [{ role: "user", content: "Hello" }],
        null,
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow("No API key");
  });
  it("falls back to fixtures when the first status request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    const api = new LocalApi();
    await api.initialize(false);
    expect(api.mock).toBe(true);
  });
});
