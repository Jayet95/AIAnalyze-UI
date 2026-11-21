import { gpuCoolingState, hardwareProfile } from "./hardware";
import type { Cooling, Live, MemorySetup, Specs } from "./types";

export type ComponentId = "board" | "cpu" | "gpu" | "ram" | "cooling" | "storage" | "power";
export function componentActivity(id: ComponentId, live: Live | null, cooling: Cooling | null) {
  if (id === "cooling") {
    const fans = cooling ? [...cooling.systemFans, ...cooling.pumps, ...cooling.gpus.flatMap(gpu => gpu.fans.map(fan => ({ ...fan, rpm: gpu.zeroRpm ? 0 : fan.rpm })))] : [];
    if (fans.some(fan => fan.rpm !== null && fan.rpm > 0)) return "active";
    return fans.length && fans.every(fan => fan.rpm === 0) ? "idle" : "unknown";
  }
  const key = id === "cpu" ? "CPU %" : id === "gpu" ? "GPU %" : id === "power" ? "CPU W" : null;
  const value = key ? live?.points.at(-1)?.m[key] : null;
  return typeof value === "number" ? value > 0 ? "active" : "idle" : "unknown";
}
export function motherboardDetails(id: ComponentId, specs: Specs, live: Live | null, coolingData: Cooling | null = null, memory: MemorySetup | null = null) {
  const profile = hardwareProfile(specs);
  const cooling = gpuCoolingState(profile.name, coolingData);
  const coolingRpm = coolingData ? [...coolingData.systemFans, ...coolingData.pumps, ...cooling.fans].map(fan => `${fan.name}: ${fan.rpm === null ? "–" : `${fan.rpm} RPM`}`).join(" · ") || "Not reported" : "Not reported";
  const m = live?.points.at(-1)?.m;
  const reading = (key: string, unit: string) => {
    const value = m?.[key];
    return typeof value === "number" ? `${value.toLocaleString()} ${unit}` : "Not reported";
  };
  const components: Record<ComponentId, { title: string; name: string; rows: [string, string][] }> = {
    board: { title: "Motherboard", name: specs.motherboardProduct, rows: [["Manufacturer", specs.motherboardManufacturer], ["BIOS", specs.biosVersion], ["Physical layout", "Schematic · not model-specific"]] },
    cpu: { title: "Processor", name: specs.cpuName, rows: [["Cores / threads", `${specs.cpuCores} / ${specs.cpuLogicalProcessors}`], ["Load", reading("CPU %", "%")], ["Temperature", reading("CPU °C", "°C")], ["Power", reading("CPU W", "W")], ["Maximum clock", `${(specs.cpuMaxClockMhz / 1000).toFixed(2)} GHz`]] },
    gpu: { title: profile.kind === "gpu" ? "Graphics card" : "Integrated graphics", name: profile.graphics?.name || "No graphics adapter reported", rows: [["Connection", profile.kind === "gpu" ? "Discrete adapter · PCIe slot not reported" : profile.kind === "apu" ? "Integrated in processor" : "Not reported"], ["Load", profile.graphics ? reading("GPU %", "%") : "Not reported"], ["Temperature", profile.graphics ? reading("GPU °C", "°C") : "Not reported"], ["Clock", profile.graphics ? reading("GPU MHz", "MHz") : "Not reported"], ["Driver", profile.graphics?.driverVersion || "Not reported"]] },
    ram: { title: "Memory / DIMM slots", name: `${memory?.totalGb ?? specs.ramTotalGb} GB system memory`, rows: [["Total installed", `${memory?.totalGb ?? specs.ramTotalGb} GB`], ["Occupied slots", memory ? `${memory.usedSlots} / ${memory.totalSlots ?? "–"}` : "Not reported"], ["Modules", memory ? memory.modules.map(module => `${module.slot}: ${module.capacityGb ?? "–"} GB ${module.type ?? "–"}`).join(" · ") : "Not reported"], ["Configured speed", memory ? memory.modules.map(module => `${module.slot}: ${module.configuredSpeedMts === null ? "–" : `${module.configuredSpeedMts} MT/s`}`).join(" · ") : "Not reported"], ["Physical order", "Not reported"]] },
    cooling: { title: "Cooling", name: coolingData ? `${coolingData.coolingType} cooling${coolingData.coolingType === "Unknown" ? "" : " (detected)"}` : "Cooling telemetry unavailable", rows: [["Cooler model", "Not reported"], ["Fan / pump RPM", coolingRpm], ["CPU temperature", reading("CPU °C", "°C")], ["GPU temperature", profile.graphics ? reading("GPU °C", "°C") : "Not reported"], ["Detection reason", coolingData?.coolingTypeReason || "Not reported"]] },
    storage: { title: "Storage / M.2 & SATA", name: "Drive connections", rows: [["M.2 / SATA occupancy", "Not reported"], ["Drive model", "Not reported"], ["Temperature", "Not reported"], ["Read / write performance", "Not reported"]] },
    power: { title: "Power delivery / VRM", name: "Power telemetry", rows: [["CPU package power", reading("CPU W", "W")], ["Power supply model", "Not reported"], ["VRM temperature", "Not reported"], ["Voltage", "Not reported"]] },
  };
  return components[id];
}