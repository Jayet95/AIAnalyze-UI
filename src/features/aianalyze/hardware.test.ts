import { describe, expect, it } from "vitest";
import fixtures from "./ui-fixtures.json";
import { gpuCoolingState, hardwareActivity, hardwareProfile } from "./hardware";
import type { Specs } from "./types";
import coolingSamples from "./cooling-fixtures.json";

const specs: Specs = fixtures["/api/specs"];
describe("hardware-adaptive presentation", () => {
  it("uses a GPU visual when a dedicated card is present, even after integrated graphics", () => {
    expect(hardwareProfile({ ...specs, gpus: [{ name: "Intel UHD Graphics 770", vramGb: 0, driverVersion: "1" }, ...specs.gpus] }).kind).toBe("gpu");
    expect(hardwareProfile(specs).name).toBe("NVIDIA GeForce RTX 4070");
  });
  it("uses an APU visual for integrated graphics without a dedicated card", () => {
    expect(hardwareProfile({ ...specs, gpus: [{ name: "AMD Radeon 780M", vramGb: 0, driverVersion: "1" }] }).kind).toBe("apu");
  });
  it("uses the detected CPU when no graphics card is reported", () => {
    expect(hardwareProfile({ ...specs, gpus: [] })).toMatchObject({ kind: "cpu", name: "AMD Ryzen 7 7800X3D 8-Core Processor", graphics: null });
  });
  it("reads GPU processing load separately from cooling activity", () => {
    expect(hardwareActivity("gpu", { gpu: "GPU", points: [{ t: 1, m: { "GPU %": 99 } }] })).toMatchObject({ active: true, load: 99, speed: "high" });
    expect(hardwareActivity("gpu", { gpu: "GPU", points: [{ t: 1, m: { "GPU %": 0 } }] }).active).toBe(false);
    expect(hardwareActivity("gpu", null)).toMatchObject({ active: false, load: null });
  });
  it("does not run fans from GPU load or invent fan counts", () => {
    expect(gpuCoolingState("GPU", null)).toMatchObject({ kind: "unknown", fans: [], active: false });
  });
  it.each([1, 2, 3])("renders exactly %i reported fans", (fanCount) => {
    expect(gpuCoolingState("GPU", { ...coolingSamples["/api/cooling"], coolingType: "Liquid", gpus: [{ name: "GPU", fanCount, fans: [], zeroRpm: false }] }).fans).toHaveLength(fanCount);
  });
  it("runs only individual fans with positive RPM, including fan-stop at zero", () => {
    const state = gpuCoolingState("GPU", { ...coolingSamples["/api/cooling"], coolingType: "Liquid", gpus: [{ name: "GPU", fanCount: 3, fans: [1200, 0, null].map(rpm => ({ name: "Fan", rpm, percent: 52 })), zeroRpm: false }] });
    expect(state.fans.map(fan => fan.active)).toEqual([true, false, false]);
  });
  it("does not treat PC-wide liquid detection as liquid GPU cooling", () => {
    expect(gpuCoolingState("NVIDIA GeForce RTX 4070", { ...coolingSamples["/api/cooling"], coolingType: "Liquid" })).toMatchObject({ kind: "air", active: true });
  });
  it("ignores cooling readings for a different adapter", () => {
    expect(gpuCoolingState("GPU 1", { ...coolingSamples["/api/cooling"], coolingType: "Liquid" }).active).toBe(false);
  });
  it("animates CPU and APU from CPU readings, not GPU readings", () => {
    const live = { gpu: "", points: [{ t: 1, m: { "GPU %": 99, "CPU %": 0 } }] };
    expect(hardwareActivity("cpu", live).active).toBe(false);
    expect(hardwareActivity("apu", live).active).toBe(false);
  });
});