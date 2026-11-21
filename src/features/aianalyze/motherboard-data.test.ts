import { describe, expect, it } from "vitest";
import fixtures from "./ui-fixtures.json";
import memorySamples from "./memory-fixtures.json";
import { componentActivity, motherboardDetails } from "./motherboard-data";
import type { MemorySetup, Specs } from "./types";
const specs: Specs = fixtures["/api/specs"];
describe("motherboard inspection data", () => {
  it("uses reported A2/B2 modules and configured speed without inventing physical order", () => {
    const memory: MemorySetup = { ...memorySamples["/api/memory"], check: { ...memorySamples["/api/memory"].check, severity: "Info" } };
    const ram = motherboardDetails("ram", specs, null, null, memory);
    expect(ram.rows).toContainEqual(["Occupied slots", "2 / 4"]);
    expect(ram.rows).toContainEqual(["Configured speed", "DIMM_A2: 4800 MT/s · DIMM_B2: 4800 MT/s"]);
    expect(ram.rows).toContainEqual(["Physical order", "Not reported"]);
  });
  it("distinguishes active, idle and unknown components without inventing RAM activity", () => {
    const live = { gpu: "GPU", points: [{ t: 1, m: { "CPU %": 35, "GPU %": 0 } }] };
    expect(componentActivity("cpu", live, null)).toBe("active");
    expect(componentActivity("gpu", live, null)).toBe("idle");
    expect(componentActivity("ram", live, null)).toBe("unknown");
  });
  it("does not invent RAM slot occupancy from total capacity", () => {
    const ram = motherboardDetails("ram", specs, null);
    expect(ram.rows).toContainEqual(["Total installed", "32 GB"]);
    expect(ram.rows).toContainEqual(["Occupied slots", "Not reported"]);
  });
  it("does not turn load into cooling fan RPM", () => {
    const cooling = motherboardDetails("cooling", specs, { gpu: "GPU", points: [{ t: 1, m: { "GPU %": 99, "CPU °C": 62 } }] });
    expect(cooling.rows).toContainEqual(["Fan / pump RPM", "Not reported"]);
    expect(cooling.rows).toContainEqual(["CPU temperature", "62 °C"]);
  });
  it("reads CPU performance directly from telemetry", () => {
    expect(motherboardDetails("cpu", specs, { gpu: "", points: [{ t: 1, m: { "CPU %": 35 } }] }).rows).toContainEqual(["Load", "35 %"]);
  });
  it("never assigns an unreported GPU slot", () => {
    expect(motherboardDetails("gpu", specs, null).rows).toContainEqual(["Connection", "Discrete adapter · PCIe slot not reported"]);
  });
});