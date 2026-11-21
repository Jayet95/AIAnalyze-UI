import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Gamepad2,
  HardDrive,
  MemoryStick,
  Monitor,
  Radio,
  Sparkles,
  Thermometer,
  Timer,
  Zap,
  CircuitBoard,
  LayoutGrid,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartSection } from "./charts";
import { CheckCard, SeverityBadge } from "./health";
import { Markdown } from "./markdown";
import { captureLabel, duration, temperatureSeverity } from "./rules";
import type { Cooling, Live, MemorySetup, Session, SessionDetail, Specs, Status } from "./types";
import { HardwareSummary, TelemetryCockpit } from "./instruments";
import { HardwareVisual } from "./hardware-visual";
import { hardwareProfile, isIntegratedGraphics } from "./hardware";
import { MotherboardMap } from "./motherboard";
import { CoolingPanel } from "./cooling";
import { MemoryPanel } from "./memory";
function Heading({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
export function CapturePanel({ status }: { status: Status | null }) {
  if (!status) return null;
  const c = status.capture;
  return (
    <section className={`capture-panel ${c.state === "Running" ? "ok" : "info"}`}>
      <div className="capture-panel-title">
        <Radio size={22} />
        <div>
          <h3>{captureLabel(c.state)}</h3>
          <p>{c.message}</p>
        </div>
        <span className="severity-badge">
          <i />
          {c.state === "Running" ? "Active" : "Paused"}
        </span>
      </div>
      <div className="capture-facts">
        <div>
          <span>Last frame</span>
          <strong>{c.currentApplication || "No frames yet"}</strong>
          <small>
            {c.lastFrameUtc
              ? new Date(c.lastFrameUtc).toLocaleString()
              : "Play a game to start a session"}
          </small>
        </div>
        <div>
          <span>Last saved session</span>
          <strong>
            {c.lastSessionUtc
              ? new Date(c.lastSessionUtc).toLocaleString()
              : "No saved sessions yet"}
          </strong>
        </div>
      </div>
    </section>
  );
}
export function LiveScreen({ live, status, specs, cooling, coolingError }: { live: Live | null; status: Status | null; specs: Specs | null; cooling: Cooling | null; coolingError: string }) {
  const last = live?.points.at(-1);
  const showGraphics = !specs || hardwareProfile(specs).graphics !== null;
  const metrics = [
    { key: "CPU °C", label: "CPU temperature", unit: "°C", Icon: Thermometer },
    { key: "CPU %", label: "CPU load", unit: "%", Icon: Cpu },
    { key: "CPU W", label: "CPU power", unit: "W", Icon: Zap },
    { key: "GPU °C", label: "GPU temperature", unit: "°C", Icon: Thermometer },
    { key: "GPU %", label: "GPU load", unit: "%", Icon: LayoutGrid },
    { key: "GPU MHz", label: "GPU clock", unit: "MHz", Icon: Timer },
  ].filter((metric) => showGraphics || !metric.key.startsWith("GPU"));
  const hot = metrics.some(
    (m) =>
      m.key.includes("°C") &&
      temperatureSeverity(last?.m[m.key] ?? null, m.key.startsWith("GPU")) !== null,
  );
  return (
    <>
      <Heading
        eyebrow="PERFORMANCE / REAL-TIME"
        title={
          hot
            ? "Thermal warning"
            : !last
              ? "Waiting for measurements"
              : "Live telemetry"
        }
        subtitle={live?.gpu || "Live measurements from this PC"}
      >
        <span className="live-note">
          <i />
          Live · last 5 minutes
        </span>
      </Heading>
      {specs && <HardwareVisual specs={specs} live={live} cooling={cooling} />}
      <CoolingPanel cooling={cooling} error={coolingError} gpuNames={specs?.gpus.map(gpu => gpu.name) ?? (live?.gpu ? [live.gpu] : [])} />
      <TelemetryCockpit live={live} showGraphics={showGraphics} />
      <div className="metric-grid">
        {metrics.map((m) => {
          const v = last?.m[m.key] ?? null;
          const severity = m.key.includes("°C")
            ? temperatureSeverity(v, m.key.startsWith("GPU"))
            : null;
          return (
            <section className={`metric-tile ${severity?.toLowerCase() || ""}`} key={m.key}>
              <div>
                <m.Icon size={18} />
                <span>{m.label}</span>
              </div>
              <strong>
                {v === null ? "–" : Math.round(v).toLocaleString()}
                <small>{v === null ? "" : m.unit}</small>
              </strong>
              <p title={v === null ? "Needs administrator rights / the PawnIO driver" : undefined}>
                {v === null
                  ? "Sensor unavailable"
                  : severity
                    ? "Running hot"
                    : m.key.includes("°C")
                      ? "Within a comfortable range"
                      : m.key.includes("%")
                        ? "Current utilization"
                        : "Latest reading"}
              </p>
              <div className="telemetry-sparkline" aria-hidden="true">
                <svg viewBox="0 0 150 34" preserveAspectRatio="none">
                  <line x1="0" y1="32" x2="150" y2="32" />
                  {(live?.points.length || 0) > 1 && (
                    <path
                      d={(live?.points || []).reduce((result, p, i) => {
                        const reading = p.m[m.key];
                        if (reading === null || reading === undefined) return result + " ";
                        const scale = m.key.includes("MHz")
                          ? 3500
                          : m.key.includes("W")
                            ? 200
                            : 110;
                        const x = (i / Math.max(1, (live?.points.length || 1) - 1)) * 150;
                        const y = 31 - Math.min(1, reading / scale) * 28;
                        const previous = live?.points[i - 1]?.m[m.key];
                        return (
                          result +
                          `${i === 0 || previous === null || previous === undefined ? "M" : "L"} ${x} ${y} `
                        );
                      }, "")}
                    />
                  )}
                </svg>
              </div>
            </section>
          );
        })}
      </div>
      <div className="charts-grid">
        <ChartSection
          title="Temperatures"
          points={live?.points || []}
          series={[
            { key: "CPU °C", label: "CPU" },
            ...(showGraphics ? [{ key: "GPU °C", label: "GPU" }] : []),
          ]}
          unit="°"
        />
        <ChartSection
          title={showGraphics ? "CPU & GPU load" : "CPU load"}
          points={live?.points || []}
          series={[
            { key: "CPU %", label: "CPU" },
            ...(showGraphics ? [{ key: "GPU %", label: "GPU" }] : []),
          ]}
          unit="%"
          domain={[0, 100]}
        />
      </div>
      {metrics.some((m) => (last?.m[m.key] ?? null) === null) && (
        <p className="sensor-note">
          Some sensors need administrator rights or the PawnIO driver. Missing readings are shown as
          –.
        </p>
      )}
      <CapturePanel status={status} />
    </>
  );
}
const findingTitles: Record<string, string> = {
  FpsDrop: "Below your usual FPS",
  CpuHot: "CPU running hot",
  GpuHot: "GPU running hot",
  GpuThrottling: "GPU throttling",
  GpuClockVaries: "GPU clock varied",
  FpsCapped: "Frame rate capped",
  GpuBound: "Limited by the GPU",
  NotGpuBound: "Not limited by the GPU",
  Stutter: "Stutter",
};
export function SessionsScreen({
  sessions,
  detail,
  id,
  status,
  ask,
}: {
  sessions: Session[] | null;
  detail: SessionDetail | null;
  id: number | null;
  status: Status | null;
  ask: (q: string, id: number | null) => void;
}) {
  if (id !== null) {
    if (!detail) return <div className="pending-state">Loading this session…</div>;
    const s = detail.session;
    const secs = (Date.parse(s.endUtc) - Date.parse(s.startUtc)) / 1000;
    return (
      <>
        <Button variant="ghost" asChild className="back-link">
          <a href="#/sessions">
            <ArrowLeft />
            All sessions
          </a>
        </Button>
        <Heading
          eyebrow={`SESSION ${s.id}`}
          title={s.application}
          subtitle={`${new Date(s.startUtc).toLocaleString()} · ${detail.gpu}`}
        >
          <Button
            onClick={() =>
              ask("Review this session and explain what affected my performance.", s.id)
            }
          >
            <Sparkles />
            Ask about this session
          </Button>
        </Heading>
        <div className="session-stat-grid">
          {[
            {
              label: "Median FPS",
              value: s.medianFps === null ? "–" : `${s.medianFps}`,
              unit: "FPS",
            },
            {
              label: "Your usual",
              value: detail.baseline.fps === null ? "–" : `${detail.baseline.fps}`,
              unit: "FPS",
            },
            { label: "Duration", value: duration(secs), unit: "" },
            { label: "Frames captured", value: s.frameCount.toLocaleString(), unit: "" },
          ].map((m) => (
            <section className="metric-tile" key={m.label}>
              <span>{m.label}</span>
              <strong>
                {m.value}
                <small>{m.unit}</small>
              </strong>
            </section>
          ))}
        </div>
        {detail.feedback && (
          <section className="assistant-feedback">
            <div>
              <Sparkles size={21} />
              <h3>Assistant’s feedback</h3>
            </div>
            <Markdown text={detail.feedback} />
          </section>
        )}
        <div className="session-findings">
          {detail.findings.map((f, i) => (
            <CheckCard
              key={i}
              feedbackTarget="finding"
              check={{
                id: f.kind,
                title: findingTitles[f.kind] || f.kind,
                summary: f.message,
                severity: f.severity,
                evidence: [],
              }}
              ask={(q) => ask(q, s.id)}
            />
          ))}
        </div>
        <p className="baseline-note">{detail.baseline.message}</p>
        <div className="charts-grid">
          <ChartSection
            title="Frame rate"
            points={detail.rows}
            series={[{ key: "fps", label: "FPS" }]}
            median={s.medianFps}
          />
          <ChartSection
            title="Temperatures"
            points={detail.rows}
            series={[
              { key: "CPU °C", label: "CPU" },
              { key: "GPU °C", label: "GPU" },
            ]}
            unit="°"
          />
          <ChartSection
            title="CPU & GPU load"
            points={detail.rows}
            series={[
              { key: "CPU %", label: "CPU" },
              { key: "GPU %", label: "GPU" },
            ]}
            unit="%"
            domain={[0, 100]}
          />
          <ChartSection
            title="GPU clock"
            points={detail.rows}
            series={[{ key: "GPU MHz", label: "GPU" }]}
            unit=" MHz"
          />
        </div>
      </>
    );
  }
  return (
    <>
      <Heading
        eyebrow="YOUR RECENT GAMES"
        title="Every session tells a story"
        subtitle="See how your PC performed while you played."
      />
      <section className="sessions-section">
        <div className="section-heading">
          <h2>
            Saved sessions <span className="count">{sessions?.length || 0}</span>
          </h2>
          <span>Most recent first</span>
        </div>
        {!sessions?.length ? (
          <div className="empty-state">
            <Gamepad2 size={44} />
            <h2>No sessions yet</h2>
            <p>Play a game for a few minutes; a session is saved 30 seconds after it closes.</p>
          </div>
        ) : (
          <div className="session-table">
            <div className="session-table-head">
              <span>Application</span>
              <span>Duration</span>
              <span>Median FPS</span>
              <span>PC health</span>
              <span />
            </div>
            {sessions.map((s) => (
              <a className="session-row" key={s.id} href={`#/sessions/${s.id}`}>
                <div className="session-game">
                  <span className="game-icon">
                    <Gamepad2 />
                  </span>
                  <div>
                    <strong>{s.application}</strong>
                    <small>
                      {new Date(s.startUtc).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </div>
                <span>{duration(s.durationSeconds)}</span>
                <strong className="fps-value">
                  {s.medianFps === null ? "–" : s.medianFps}
                  <small> FPS</small>
                </strong>
                <SeverityBadge severity={s.worst} />
                <ArrowRight size={18} />
              </a>
            ))}
          </div>
        )}
      </section>
      {status?.capture.state !== "Running" && <CapturePanel status={status} />}
    </>
  );
}
export function SystemScreen({ specs, live, cooling, memory, memoryError, ask }: { specs: Specs | null; live: Live | null; cooling: Cooling | null; memory: MemorySetup | null; memoryError: string; ask: (question: string) => void }) {
  if (!specs)
    return (
      <div className="empty-state">
        <Monitor size={44} />
        <h2>Your system details aren’t available yet</h2>
        <p>Start the AIAnalyze service to collect your PC’s information.</p>
      </div>
    );
  const items = [
    {
      Icon: Cpu,
      title: "Processor",
      name: specs.cpuName,
      rows: [
        ["Cores", String(specs.cpuCores)],
        ["Threads", String(specs.cpuLogicalProcessors)],
        ["Maximum clock", `${(specs.cpuMaxClockMhz / 1000).toFixed(2)} GHz`],
      ],
    },
    {
      Icon: MemoryStick,
      title: "Memory",
      name: `${specs.ramTotalGb} GB installed`,
      rows: [["Total memory", `${specs.ramTotalGb} GB`]],
    },
    ...specs.gpus.map((g) => ({
      Icon: Monitor,
      title: isIntegratedGraphics(g.name) ? "Integrated graphics" : "Graphics card",
      name: g.name,
      rows: [
        ["Video memory", `${g.vramGb} GB`],
        ["Driver version", g.driverVersion],
      ],
    })),
    {
      Icon: CircuitBoard,
      title: "Motherboard & BIOS",
      name: specs.motherboardProduct,
      rows: [
        ["Manufacturer", specs.motherboardManufacturer],
        ["BIOS version", specs.biosVersion],
      ],
    },
    {
      Icon: LayoutGrid,
      title: "Windows",
      name: specs.osName,
      rows: [
        ["Version", specs.osVersion],
        ["Build", specs.osBuild],
      ],
    },
  ];
  return (
    <>
      <Heading
        eyebrow="HARDWARE / MACHINE PROFILE"
        title="System configuration"
        subtitle={`${specs.computerManufacturer} ${specs.computerModel}`}
      />
      <HardwareVisual specs={specs} live={live} cooling={cooling} />
      <HardwareSummary specs={specs} />
      <MemoryPanel memory={memory} error={memoryError} ask={ask} />
      <MotherboardMap specs={specs} live={live} cooling={cooling} memory={memory} />
      <div className="system-grid">
        {items.map((item, i) => (
          <section className="spec-card" key={i}>
            <div className="spec-title">
              <item.Icon size={20} />
              <h3>{item.title}</h3>
            </div>
            <h2>{item.name}</h2>
            <dl>
              {item.rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
