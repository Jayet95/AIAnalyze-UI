import { CircleHelp, Droplets, Fan, LoaderCircle } from "lucide-react";
import type { Cooling, CoolingFan } from "./types";
import { fanMotion } from "./cooling-rules";

function FanRow({ fan, pump = false, stopped = false }: { fan: CoolingFan; pump?: boolean; stopped?: boolean }) {
  const motion = fanMotion(fan, stopped);
  const Icon = pump ? Droplets : Fan;
  return <div className="cooling-row">
    <Icon size={20} className={`${pump ? "pump-icon" : "cooling-fan-icon"} ${motion.active ? "running" : "stopped"} speed-${motion.speed}`} />
    <div className="cooling-row-label"><span>{fan.name}</span><div className="cooling-percent"><progress aria-label={`${fan.name} speed`} max={100} {...(fan.percent === null ? { value: 0 } : { value: fan.percent })} /><small>{fan.percent === null ? "–" : `${fan.percent}%`}</small></div></div>
    <strong className="cooling-rpm">{fan.rpm === null ? "–" : fan.rpm.toLocaleString()}<small>RPM</small></strong>
  </div>;
}

export function CoolingPanel({ cooling, error, gpuNames }: { cooling: Cooling | null; error: string; gpuNames: string[] }) {
  const Icon = cooling?.coolingType === "Liquid" ? Droplets : cooling?.coolingType === "Air" ? Fan : CircleHelp;
  return <section className="cooling-panel" aria-label="Cooling">
    <div className="cooling-heading"><Icon size={20} /><h2>{cooling ? `${cooling.coolingType === "Unknown" ? "Cooling unknown" : `${cooling.coolingType} cooling (detected)`}` : "Cooling"}</h2>{cooling && <time dateTime={cooling.atUtc}>{new Date(cooling.atUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>}</div>
    {!cooling ? <p className="cooling-reason"><LoaderCircle size={14} />{error || "Waiting for the first cooling reading…"}</p> : <>
      <p className="cooling-reason" title={cooling.coolingTypeReason}>{cooling.coolingTypeReason}</p>
      {error && <p className="cooling-reason" role="status">{error}</p>}
      <div className="cooling-groups">
        {cooling.gpus.map((gpu, index) => <div className="cooling-group" key={`${gpu.name}-${index}`}><h3>{gpu.name}<span>{gpu.fanCount} {gpu.fanCount === 1 ? "fan" : "fans"}</span></h3>
          {gpu.zeroRpm && <p className="zero-rpm-note">Fans stopped: normal at low temperature (zero-RPM mode)</p>}
          {gpu.fans.map((fan, i) => <FanRow key={i} fan={fan} stopped={gpu.zeroRpm || Boolean(error)} />)}
        </div>)}
        {gpuNames.filter(name => !cooling.gpus.some(gpu => gpu.name === name)).map(name => <p key={name} className="cooling-reason">{gpuNames.length > 1 ? `${name}: ` : ""}This graphics card doesn't report its fans.</p>)}
        {cooling.systemFans.length > 0 && <div className="cooling-group"><h3>CPU & case fans</h3>{cooling.systemFans.map((fan, i) => <FanRow key={i} fan={fan} stopped={Boolean(error)} />)}</div>}
        {cooling.pumps.length > 0 && <div className="cooling-group"><h3>Pumps</h3>{cooling.pumps.map((fan, i) => <FanRow key={i} fan={fan} pump stopped={Boolean(error)} />)}</div>}
      </div>
    </>}
  </section>;
}