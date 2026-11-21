import { CircuitBoard, Cpu, Fan, HardDrive, MemoryStick, Monitor, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { componentActivity, motherboardDetails } from "./motherboard-data";
import { hardwareProfile } from "./hardware";
import type { Cooling, Live, MemorySetup, Specs } from "./types";
import { MemorySlots } from "./memory";
import { memoryChannelTone, memorySlots } from "./memory-rules";
import { DetailReveal } from "./detail-reveal";

const targets = [
  { id: "board", name: "Motherboard", Icon: CircuitBoard },
  { id: "cpu", name: "CPU", Icon: Cpu },
  { id: "ram", name: "RAM slots", Icon: MemoryStick },
  { id: "gpu", name: "Graphics", Icon: Monitor },
  { id: "cooling", name: "Cooling", Icon: Fan },
  { id: "storage", name: "Storage", Icon: HardDrive },
  { id: "power", name: "Power / VRM", Icon: Zap },
] as const;

function BoardDrawing({ discrete, memory }: { discrete: boolean; memory: MemorySetup | null }) {
  const slots = memory ? memorySlots(memory) : Array.from({ length: 4 }, () => null);
  return <svg className="motherboard-drawing" viewBox="0 0 600 440" aria-hidden="true">
    <rect className="board-pcb" x="50" y="15" width="495" height="410" rx="6" />
    <path className="board-trace" d="M 180 155 H 120 V 300 H 195 M 315 155 H 370 V 275 H 465 M 260 212 V 260 H 450 M 320 198 H 342 V 347 H 470 M 105 365 H 210 V 392 H 380 M 320 100 H 350 V 50 H 390 M 115 80 H 147 V 115" />
    {[ [65,30], [530,30], [65,410], [530,410] ].map(([x,y], i) => <circle key={i} className="board-mount" cx={x} cy={y} r="5" />)}
    <rect className="board-io" x="58" y="60" width="47" height="183" rx="3" />
    {Array.from({ length: 7 },(_,i)=><rect key={i} className="board-port" x="62" y={70+i*23} width="38" height="14" rx="2" />)}
    <rect className="board-heatsink" x="128" y="62" width="45" height="155" rx="3" />
    {Array.from({ length: 7 },(_,i)=><path key={i} className="board-fin" d={`M ${134+i*5} 70 V 209`} />)}
    <rect className="board-heatsink" x="185" y="42" width="155" height="30" rx="3" />
    <rect className="board-socket" x="184" y="91" width="151" height="135" rx="4" />
    <rect className="board-chip" x="204" y="110" width="111" height="97" rx="3" />
    <path className="board-chip-lines" d="M 215 120 H 304 V 196 H 215 Z" />
    <text className="board-label" x="259" y="154" textAnchor="middle">CPU</text>
    <text className="board-micro-label" x="259" y="175" textAnchor="middle">SOCKET</text>
    {slots.map((module,i) => {
      const x = 375 + i * (100 / Math.max(slots.length, 1));
      return <g key={i} className={module && memory ? `board-memory installed ${memoryChannelTone(module, memory.modules)}` : "board-memory"}>
        <rect className="board-dimm" x={x} y="55" width={Math.min(13, 75 / slots.length)} height="179" rx="2" />
        {module && <>{[0,1,2,3].map(chip => <rect key={chip} className="board-memory-chip" x={x+2} y={75+chip*33} width={Math.min(9, 55/slots.length)} height="22" rx="1" />)}<title>{module.slot} · {module.capacityGb ?? "–"} GB {module.type ?? "–"}</title></>}
        <path className="board-dimm-lock" d={`M ${x-4} 58 H ${x+17} M ${x-4} 230 H ${x+17}`} />
      </g>;
    })}
    <rect className="board-power" x="511" y="80" width="18" height="102" rx="2" />
    <rect className="board-pcie" x="123" y="279" width="276" height="15" rx="2" />
    <rect className="board-pcie" x="123" y="339" width="230" height="12" rx="2" />
    {discrete && <g><rect className="board-gpu" x="113" y="267" width="296" height="50" rx="3" /><path className="board-gpu-edge" d="M 125 272 H 390" /><text className="board-label" x="263" y="300" textAnchor="middle">GPU / PCIe</text></g>}
    <rect className="board-m2" x="193" y="369" width="155" height="22" rx="2" />
    <text className="board-micro-label" x="267" y="384" textAnchor="middle">M.2</text>
    <rect className="board-chipset" x="429" y="318" width="66" height="69" rx="3" />
    <path className="board-chip-lines" d="M 438 330 H 486 M 438 340 H 486 M 438 350 H 486 M 438 360 H 486 M 438 370 H 486" />
    <circle className="board-battery" cx="148" cy="386" r="16" />
    <rect className="board-header" x="380" y="401" width="112" height="9" />
    <text className="board-micro-label" x="467" y="294" textAnchor="middle">CHIPSET</text>
    <text className="board-micro-label" x="150" y="237" textAnchor="middle">VRM</text>
  </svg>;
}

export function MotherboardMap({ specs, live, cooling, memory }: { specs: Specs; live: Live | null; cooling: Cooling | null; memory: MemorySetup | null }) {
  const profile = hardwareProfile(specs);
  return <section className="motherboard-section" aria-label="Motherboard component map">
    <div className="section-heading"><h2><CircuitBoard size={19} /> Motherboard / component map</h2><span className="board-schematic-note">{memory ? "Schematic · physical slot order unknown" : "Schematic · slot occupancy not reported"}</span></div>
    <div className="motherboard-layout hover-inspection">
      <div className={`motherboard-canvas cpu-${componentActivity("cpu", live, cooling)} gpu-${componentActivity("gpu", live, cooling)} cooling-${componentActivity("cooling", live, cooling)}`}>
        <BoardDrawing discrete={profile.kind === "gpu"} memory={memory} />
        {targets.map(({ id, name, Icon }) => {
          const details = motherboardDetails(id, specs, live, cooling, memory);
          const activity = componentActivity(id, live, cooling);
          return <DetailReveal key={id} label={`${name} details`} className="board-detail-popover" trigger={<Button variant="ghost" size="sm" className={`board-hotspot hotspot-${id} component-${activity}`} aria-label={`Inspect ${name}`}><Icon size={14} /><span>{name}</span><i /></Button>}>
            <div className="component-inspector"><span className="eyebrow">COMPONENT / {id.toUpperCase()} · {activity === "unknown" ? "ACTIVITY NOT REPORTED" : activity.toUpperCase()}</span><h3>{details.title}</h3><p>{details.name}</p>
              <dl>{details.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value === "Not reported" ? "unreported" : ""}>{value}</dd></div>)}</dl>
              {id === "ram" && (memory ? <MemorySlots memory={memory} compact /> : <p className="cooling-reason">RAM slots not reported</p>)}
            </div>
          </DetailReveal>;
        })}
      </div>
    </div>
  </section>;
}