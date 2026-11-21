import { LoaderCircle, MemoryStick } from "lucide-react";
import { CheckCard, SeverityBadge } from "./health";
import { Button } from "@/components/ui/button";
import { DetailReveal } from "./detail-reveal";
import { memoryChannelTone, memorySlots, memorySpeed } from "./memory-rules";
import type { MemorySetup } from "./types";

export function MemorySlots({ memory, compact = false }: { memory: MemorySetup; compact?: boolean }) {
  return <div className={`memory-slot-map ${compact ? "compact" : ""}`} aria-label="Reported memory slots">
    {memorySlots(memory).map((module, index) => {
      if (!module) return <div className="memory-slot empty" key={`empty-${index}`}><MemoryStick size={22} /><strong>Empty</strong></div>;
      const speed = memorySpeed(module);
      return <DetailReveal key={`${module.slot}-${index}`} label={`${module.slot} details`} trigger={<Button variant="ghost" className={`memory-slot installed ${memoryChannelTone(module, memory.modules)}`} aria-label={`Inspect ${module.slot}`}>
        <div className="memory-stick-light" />
        <div className="memory-stick-body" aria-hidden="true"><MemoryStick size={26} /><div className="memory-chips">{[0, 1, 2, 3].map(chip => <i key={chip} />)}</div><div className="memory-contacts" /></div>
        <span className="memory-slot-label">{module.slot}</span>
      </Button>}>
        <h3>{module.slot}</h3>
        <span className="memory-channel">Channel {module.channel ?? "unknown"}</span>
        <strong>{module.capacityGb ?? "–"} GB <small>{module.type ?? "–"}</small></strong>
        <span className="memory-speed">{speed.configured}</span>
        {speed.reported && <span className="memory-reported">{speed.reported}</span>}
        <div className="memory-model"><span>{module.manufacturer ?? "Manufacturer unknown"}</span><span>{module.partNumber ?? "Model unknown"}</span><span>{module.bank ?? "Bank unknown"}</span></div>
      </DetailReveal>;
    })}
  </div>;
}

export function MemoryPanel({ memory, error, ask }: { memory: MemorySetup | null; error: string; ask: (question: string) => void }) {
  return <section className="memory-panel" aria-label="Memory setup">
    <div className="section-heading"><h2><MemoryStick size={20} /> Memory setup</h2>{memory && <div className="memory-heading-summary"><span>{memory.totalGb} GB · {memory.usedSlots} / {memory.totalSlots ?? "–"} slots used</span><DetailReveal label="Memory setup check" className="memory-check-popover" trigger={<Button variant="ghost" size="sm" aria-label="Inspect Memory setup check"><SeverityBadge severity={memory.check.severity} /></Button>}>
      {memory.check.severity !== null ? <CheckCard check={memory.check} ask={ask} /> : <div className="memory-passed"><SeverityBadge severity={null} /><div><h3>{memory.check.title}</h3><p>{memory.check.summary}</p>{memory.check.evidence.map((item, i) => <p key={i}>{item}</p>)}</div></div>}
    </DetailReveal></div>}</div>
    {error ? <p className="cooling-reason" role="status">{error}</p> : !memory ? <p className="cooling-reason" role="status"><LoaderCircle size={14} className="spin" /> Waiting for the first memory health check…</p> : <>
      <MemorySlots memory={memory} />
      <p className="memory-map-note">Reported slot labels · physical order unavailable{memory.totalSlots === null ? " · total slots unknown" : ""}</p>
    </>}
  </section>;
}