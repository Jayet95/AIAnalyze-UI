import { Cpu, CircuitBoard, Zap } from "lucide-react";
import { gpuCoolingState, hardwareActivity, hardwareProfile } from "./hardware";
import type { Cooling, Live, Specs } from "./types";

function Fan({ x, active, rpm, speed }: { x: number; active: boolean; rpm: number | null; speed: string }) {
  return (
    <g transform={`translate(${x} 126)`}>
      <circle className="fan-housing" r="66" />
      <circle className="fan-ring" r="61" />
      <g className={`hardware-fan ${active ? "fan-running" : "fan-stopped"} fan-speed-${speed}`}>
        {Array.from({ length: 9 }, (_, i) => <path key={i} transform={`rotate(${i * 40})`} className="fan-blade" d="M -8 -18 C -44 -16 -58 -43 -39 -53 C -10 -59 16 -47 18 -22 L 7 -12 Z" />)}
      </g>
      <circle className="fan-hub" r="20" />
      <circle className="fan-center" r="8" />
      <text className="hardware-svg-label" x="0" y="82" textAnchor="middle">{rpm === null ? "RPM unknown" : `${rpm} RPM`}</text>
    </g>
  );
}

function GpuVisual({ cooling }: { cooling: ReturnType<typeof gpuCoolingState> }) {
  return (
    <svg viewBox="0 0 510 270" role="img" aria-label={cooling.kind === "air" ? `Graphics card with ${cooling.fans.length} cooling fans` : "Graphics card · cooling configuration unknown"}>
      <path className="gpu-backplate" d="M 41 36 L 475 36 490 54 490 207 460 229 41 229 Z" />
      <path className="gpu-body" d="M 44 52 L 460 52 476 70 476 197 458 211 44 211 Z" />
      <path className="gpu-facet" d="M 44 52 L 460 52 476 70 315 80 258 58 190 80 44 69 Z M 44 196 L 185 177 260 205 330 180 476 197 458 211 44 211 Z" />
      <path className="gpu-bracket" d="M 25 28 H 43 V 239 H 25 Z" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} className="gpu-vent" x="29" y={65 + i * 15} width="8" height="8" rx="2" />)}
      <path className="gpu-connector" d="M 91 228 H 293 V 239 H 91 Z" />
      {cooling.kind === "air" && cooling.fans.map((fan, i) => <Fan key={i} x={cooling.fans.length === 1 ? 262 : cooling.fans.length === 2 ? 178 + i * 168 : 120 + i * 142} active={fan.active} rpm={fan.rpm} speed={fan.speed} />)}
      {cooling.kind === "unknown" && <g><path className="gpu-unknown-lines" d="M 90 95 H 430 M 90 126 H 430 M 90 157 H 430" /><text className="hardware-svg-label" x="262" y="186" textAnchor="middle">COOLING CONFIGURATION NOT REPORTED</text></g>}
      <path className="gpu-rgb-edge" d="M 65 44 H 446 L 466 57" />
      <text className="hardware-svg-label" x="315" y="246">GRAPHICS ENGINE</text>
    </svg>
  );
}

function ProcessorVisual({ apu }: { apu: boolean }) {
  return (
    <svg viewBox="0 0 510 270" role="img" aria-label={apu ? "APU processor with animated integrated graphics activity" : "CPU processor with animated core activity"}>
      {Array.from({ length: 8 }, (_, i) => {
        const y = 55 + i * 23;
        return <g key={i}><path className="processor-trace" d={`M 45 ${y} H 100 L 130 ${y + 8} H 166 M 344 ${y + 8} H 378 L 410 ${y} H 465`} /><path className="processor-signal" d={`M 45 ${y} H 100 L 130 ${y + 8} H 166 M 344 ${y + 8} H 378 L 410 ${y} H 465`} /></g>;
      })}
      <rect className="processor-socket" x="151" y="27" width="208" height="208" rx="8" />
      {Array.from({ length: 13 }, (_, i) => <g key={i}><path className="processor-pin" d={`M ${171 + i * 14} 17 V 27 M ${171 + i * 14} 235 V 245 M 141 ${46 + i * 14} H 151 M 359 ${46 + i * 14} H 369`} /></g>)}
      <rect className="processor-package" x="165" y="41" width="180" height="180" rx="5" />
      <rect className="processor-die" x="186" y="62" width="138" height="138" rx="3" />
      <text className="processor-name" x="255" y="95" textAnchor="middle">{apu ? "APU" : "CPU"}</text>
      <g className="processor-cores">{Array.from({ length: 8 }, (_, i) => <rect key={i} className="processor-core" x={203 + (i % 4) * 27} y={110 + Math.floor(i / 4) * 27} width="20" height="19" rx="2" />)}</g>
      <text className="hardware-svg-label" x="255" y="181" textAnchor="middle">{apu ? "CPU + INTEGRATED GRAPHICS" : "PROCESSING ENGINE"}</text>
    </svg>
  );
}

export function HardwareVisual({ specs, live, cooling: coolingData }: { specs: Specs; live: Live | null; cooling: Cooling | null }) {
  const profile = hardwareProfile(specs);
  const activity = hardwareActivity(profile.kind, live);
  const cooling = gpuCoolingState(profile.name, coolingData);
  const Icon = profile.kind === "gpu" ? Zap : profile.kind === "apu" ? CircuitBoard : Cpu;
  return (
    <section className={`hardware-stage adaptive-hardware hardware-${profile.kind} activity-${activity.speed} ${activity.active ? "hardware-active" : "hardware-idle"}`} data-hardware={profile.kind} data-active={activity.active}>
      <div className="hardware-identity">
        <span><Icon size={16} />{profile.kind === "gpu" ? "DISCRETE GRAPHICS / GPU" : profile.kind === "apu" ? "INTEGRATED GRAPHICS / APU" : "PROCESSOR / CPU"}</span>
        <h2>{profile.name}</h2>
        <p>{profile.kind === "apu" ? profile.graphics?.name : `${specs.computerManufacturer} ${specs.computerModel}`}</p>
        <div className="hardware-activity"><i /><strong>{activity.load === null ? "Awaiting telemetry" : activity.active ? "Processing" : "Idle"}</strong><span>{activity.load === null ? "—" : `${Math.round(activity.load)}% load`}</span></div>
        <span className="hardware-chip">{profile.graphics ? `Driver ${profile.graphics.driverVersion}` : `${specs.cpuCores} cores / ${specs.cpuLogicalProcessors} threads`}</span>
        {profile.kind === "gpu" && <p className="cooling-status">{cooling.kind === "unknown" ? "Cooling details not reported" : cooling.zeroRpm ? "Fans stopped: normal at low temperature (zero-RPM mode)" : `${cooling.fans.length} fans · ${cooling.fans.some(fan => fan.rpm === null) ? "some RPM readings unavailable" : cooling.active ? "cooling active" : "fans stopped"}`}</p>}
      </div>
      <div className="hardware-motion">{profile.kind === "gpu" ? <GpuVisual cooling={cooling} /> : <ProcessorVisual apu={profile.kind === "apu"} />}<span>{profile.kind === "gpu" ? "Cooling telemetry" : "Processor activity visualization"}</span></div>
    </section>
  );
}