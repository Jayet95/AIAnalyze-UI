import { Activity, Cpu, Gauge, MemoryStick, Radio, Zap } from "lucide-react";
import type { Live, Specs } from "./types";
import { temperatureSeverity } from "./rules";
import { hardwareProfile } from "./hardware";
export function Tachometer({
  value,
  label,
  unit,
  max = 100,
  gpu = false,
}: {
  value: number | null;
  label: string;
  unit: string;
  max?: number;
  gpu?: boolean;
}) {
  const severity = unit === "°C" ? temperatureSeverity(value, gpu) : null;
  const filled = value === null ? 0 : Math.min(1, Math.max(0, value / max));
  return (
    <div className={`tachometer ${severity?.toLowerCase() || ""}`}>
      <svg viewBox="0 0 220 175" aria-hidden="true">
        <path className="dial-track" d="M 30 142 A 91 91 0 1 1 190 142" pathLength="100" />
        <path
          className="dial-value"
          d="M 30 142 A 91 91 0 1 1 190 142"
          pathLength="100"
          strokeDasharray={`${filled * 100} 100`}
        />
        {Array.from({ length: 31 }, (_, i) => {
          const angle = ((145 + i * 8.3) * Math.PI) / 180;
          const r = i % 5 === 0 ? 72 : 77;
          return (
            <line
              className="dial-tick"
              key={i}
              x1={110 + Math.cos(angle) * r}
              y1={91 + Math.sin(angle) * r}
              x2={110 + Math.cos(angle) * 83}
              y2={91 + Math.sin(angle) * 83}
            />
          );
        })}
        <text x="32" y="163">
          0
        </text>
        <text x="184" y="163" textAnchor="end">
          {max}
        </text>
      </svg>
      <div className="dial-reading">
        <span>{label}</span>
        <strong>
          {value === null ? "–" : Math.round(value)}
          <small>{value !== null && unit}</small>
        </strong>
        <p>{value === null ? "Sensor unavailable" : severity ? "Running hot" : "Latest reading"}</p>
      </div>
    </div>
  );
}
export function TelemetryCockpit({ live, showGraphics = true }: { live: Live | null; showGraphics?: boolean }) {
  const point = live?.points.at(-1);
  return (
    <section className="telemetry-cockpit">
      <div className="cockpit-heading">
        <div>
          <span className="eyebrow">PERFORMANCE / TELEMETRY</span>
          <h2>Engine telemetry</h2>
        </div>
        <span className="live-note">
          <i />
          Live measurements
        </span>
      </div>
      <div className="cockpit-instruments">
        <Tachometer value={point?.m["CPU %"] ?? null} label="CPU LOAD" unit="%" />
        {showGraphics && <Tachometer value={point?.m["GPU %"] ?? null} label="GPU LOAD" unit="%" gpu />}
        <Tachometer
          value={point?.m[showGraphics ? "GPU °C" : "CPU °C"] ?? null}
          label={showGraphics ? "GPU TEMPERATURE" : "CPU TEMPERATURE"}
          unit="°C"
          max={110}
          gpu={showGraphics}
        />
        <div className="cockpit-readouts">
          <div>
            <Zap size={15} />
            <span>CPU POWER</span>
            <strong>
              {point?.m["CPU W"] ?? "–"}
              <small>
                {point?.m["CPU W"] !== null && point?.m["CPU W"] !== undefined ? " W" : ""}
              </small>
            </strong>
          </div>
          {showGraphics && <div>
            <Gauge size={15} />
            <span>GPU CLOCK</span>
            <strong>
              {point?.m["GPU MHz"]?.toLocaleString() ?? "–"}
              <small>
                {point?.m["GPU MHz"] !== null && point?.m["GPU MHz"] !== undefined ? " MHz" : ""}
              </small>
            </strong>
          </div>}
          <div>
            <Activity size={15} />
            <span>CPU TEMP</span>
            <strong>
              {point?.m["CPU °C"] ?? "–"}
              <small>
                {point?.m["CPU °C"] !== null && point?.m["CPU °C"] !== undefined ? " °C" : ""}
              </small>
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
export function HardwareSummary({ specs }: { specs: Specs }) {
  const profile = hardwareProfile(specs);
  return (
    <div className="hardware-summary">
      <div>
        <Cpu size={18} />
        <span>CPU CORES</span>
        <strong>
          {specs.cpuCores}
          <small> / {specs.cpuLogicalProcessors} threads</small>
        </strong>
      </div>
      <div>
        <Gauge size={18} />
        <span>MAX CPU CLOCK</span>
        <strong>
          {(specs.cpuMaxClockMhz / 1000).toFixed(2)}
          <small> GHz</small>
        </strong>
      </div>
      <div>
        <MemoryStick size={18} />
        <span>SYSTEM MEMORY</span>
        <strong>
          {specs.ramTotalGb}
          <small> GB</small>
        </strong>
      </div>
      <div>
        <Radio size={18} />
        <span>{profile.kind === "gpu" ? "GRAPHICS MEMORY" : "PROCESSOR THREADS"}</span>
        <strong>
          {profile.kind === "gpu" ? profile.graphics.vramGb : specs.cpuLogicalProcessors}
          <small>{profile.kind === "gpu" ? " GB" : " threads"}</small>
        </strong>
      </div>
    </div>
  );
}
