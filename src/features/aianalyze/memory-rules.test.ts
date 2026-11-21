import { describe, expect, it } from "vitest";
import samples from "./memory-fixtures.json";
import { memoryChannelTone, memorySlots, memorySpeed, withMemoryCheck } from "./memory-rules";
import type { MemorySetup } from "./types";

const memory: MemorySetup = { ...samples["/api/memory"], check: { ...samples["/api/memory"].check, severity: "Info" } };
describe("reported memory setup", () => {
  it("shows four slots with two 16 GB DDR5 sticks and unnamed empty slots", () => {
    const slots = memorySlots(memory);
    expect(slots).toHaveLength(4);
    expect(slots.filter(Boolean).map(module => module?.slot)).toEqual(["DIMM_A2", "DIMM_B2"]);
    expect(slots.filter(module => module === null)).toHaveLength(2);
    expect(slots[0]?.capacityGb).toBe(16);
    expect(slots[0]?.type).toBe("DDR5");
  });
  it("uses configured 4800 MT/s as the reading and only notes the higher reported 6000", () => {
    const module = memory.modules[0];
    if (!module) throw new Error("Missing fixture module");
    expect(memorySpeed(module)).toEqual({ configured: "4800 MT/s", reported: "reports 6000" });
  });
  it("keeps unknown speed unknown without suggesting an XMP speed", () => {
    const module = memory.modules[0];
    if (!module) throw new Error("Missing fixture module");
    expect(memorySpeed({ ...module, configuredSpeedMts: null, ratedSpeedMts: null })).toEqual({ configured: "–", reported: null });
  });
  it("groups exact channel IDs and keeps unknown channels distinct", () => {
    const module = memory.modules[0];
    if (!module) throw new Error("Missing fixture module");
    const modules = [ { ...module, channel: "0A" }, { ...module, channel: "1A" } ];
    expect(memoryChannelTone({ ...module, channel: "0A" }, modules)).toBe("channel-0");
    expect(memoryChannelTone({ ...module, channel: "1A" }, modules)).toBe("channel-1");
    expect(memoryChannelTone({ ...module, channel: null }, modules)).toBe("unknown");
  });
  it("preserves laptop labels and two slots without inventing desktop positions", () => {
    const modules = memory.modules.map((module, i) => ({ ...module, slot: `Controller0-Channel${i === 0 ? "A" : "B"}-DIMM0`, capacityGb: 32 }));
    expect(memorySlots({ ...memory, totalSlots: 2, totalGb: 64, modules })).toHaveLength(2);
    expect(memorySlots({ ...memory, totalSlots: 2, modules })[0]?.slot).toBe("Controller0-ChannelA-DIMM0");
  });
  it("includes the service memory check exactly once and preserves server severity", () => {
    expect(withMemoryCheck([], memory)[0]?.severity).toBe("Info");
    const warning = { ...memory.check, severity: "Warning" as const };
    expect(withMemoryCheck([warning], memory)).toEqual([warning]);
    expect(withMemoryCheck([], { ...memory, check: { ...memory.check, severity: null } })[0]?.severity).toBe(null);
  });
});