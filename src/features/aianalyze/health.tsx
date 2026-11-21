import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Cpu,
  HardDrive,
  HeartPulse,
  Info,
  LoaderCircle,
  MemoryStick,
  Monitor,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Check as PCCheck, Cooling, Health, MemorySetup, Report, Severity } from "./types";
import { withMemoryCheck } from "./memory-rules";
import { CoolingPanel } from "./cooling";
import { relativeTime } from "./rules";
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`severity-badge ${severity === null ? "ok" : severity.toLowerCase()}`}>
      <i />
      {severity === "Critical"
        ? "Needs attention"
        : severity === "Warning"
          ? "Worth a look"
          : severity === "Info"
            ? "Suggestion"
            : "Healthy"}
    </span>
  );
}
export function CheckCard({ check, ask }: { check: PCCheck; ask: (question: string) => void }) {
  const Icon = check.id === "memory-config" ? MemoryStick : check.id.startsWith("disk")
    ? HardDrive
    : check.id === "display-driver"
      ? Monitor
      : check.id === "uptime"
        ? Clock3
        : TriangleAlert;
  return (
    <article className={`problem-card ${check.severity?.toLowerCase() || "ok"}`}>
      <div className="problem-icon">
        <Icon size={21} />
      </div>
      <div className="problem-content">
        <div className="problem-title">
          <h3>{check.title}</h3>
          <SeverityBadge severity={check.severity} />
        </div>
        <p>{check.summary}</p>
        {check.evidence.length > 0 && (
          <ul className="evidence-list">
            {check.evidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        <Button
          variant="link"
          size="sm"
          onClick={() => ask(`Explain this and what I should do: ${check.title}. ${check.summary}`)}
        >
          <Sparkles />
          Ask about this
          <ArrowUpRight size={14} />
        </Button>
      </div>
    </article>
  );
}
function Meter({
  value,
  tone = "primary",
  label,
}: {
  value: number;
  tone?: string;
  label: string;
}) {
  return (
    <div
      className={`meter ${tone}`}
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <progress max={100} value={Math.max(0, Math.min(100, value))} />
    </div>
  );
}
function RightNow({ report, cooling, coolingError, gpuNames }: { report: Report; cooling: Cooling | null; coolingError: string; gpuNames: string[] }) {
  const [sort, setSort] = React.useState<"cpu" | "memory">("cpu");
  return (
    <aside className="right-now">
      <div className="section-heading">
        <h2>Right now</h2>
        <span className="live-note">
          <i />
          Latest reading
        </span>
      </div>
      <CoolingPanel cooling={cooling} error={coolingError} gpuNames={gpuNames} />
      <section className="resource-card">
        <div className="resource-title">
          <MemoryStick size={18} />
          <h3>Memory</h3>
          <span className="resource-state">
            {report.checks.find((c) => c.id === "memory")?.severity === null
              ? "Normal use"
              : "Current use"}
          </span>
        </div>
        <div className="memory-reading">
          <strong>
            {report.memory.usedGb.toFixed(1)}
            <small> GB</small>
          </strong>
          <span>of {report.memory.totalGb.toFixed(1)} GB</span>
        </div>
        <Meter value={report.memory.usedPercent} label="Memory used" />
        <div className="resource-caption">
          <span>{Math.round(report.memory.usedPercent)}% in use</span>
          <span>{(report.memory.totalGb - report.memory.usedGb).toFixed(1)} GB available</span>
        </div>
        <div className="resource-divider" />
        <div className="resource-title">
          <HardDrive size={18} />
          <h3>Storage</h3>
        </div>
        {report.drives.map((d) => (
          <div className="drive" key={d.name}>
            <div className="drive-title">
              <strong>
                {d.name} <span>{d.label}</span>
              </strong>
              {d.freePercent < 10 && <TriangleAlert size={15} className="text-warning" />}
            </div>
            <Meter
              value={100 - d.freePercent}
              tone={d.freePercent < 10 ? "warning" : "primary"}
              label={`${d.name} storage used`}
            />
            <div className="resource-caption">
              <span className={d.freePercent < 10 ? "text-warning" : ""}>
                {Math.round(d.freeBytes / 1073741824)} GB free
              </span>
              <span>of {Math.round(d.totalBytes / 1073741824).toLocaleString()} GB</span>
            </div>
          </div>
        ))}
      </section>
      <section className="resource-card programs">
        <div className="resource-title">
          <Activity size={18} />
          <h3>Top programs</h3>
        </div>
        <div className="segment-control" aria-label="Program ranking">
          <Button
            variant={sort === "cpu" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSort("cpu")}
          >
            <Cpu />
            CPU
          </Button>
          <Button
            variant={sort === "memory" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSort("memory")}
          >
            <MemoryStick />
            Memory
          </Button>
        </div>
        {(sort === "cpu" ? report.topByCpu : report.topByMemory).map((p, i) => (
          <div className="program-row" key={p.processId}>
            <span className="program-icon">
              <Monitor size={16} />
            </span>
            <span>{p.name}</span>
            <strong>
              {sort === "cpu"
                ? `${p.cpuPercent.toFixed(1)}%`
                : p.memoryMb >= 1024
                  ? `${(p.memoryMb / 1024).toFixed(1)} GB`
                  : `${p.memoryMb} MB`}
            </strong>
          </div>
        ))}
        <p className="footnote">
          {sort === "cpu" ? "Share of your whole CPU" : "Memory used by each program"}
        </p>
      </section>
      <div className="local-note">
        <ShieldCheck size={17} />
        <div>
          <strong>On your PC. For your PC.</strong>
          <p>Your measurements stay on this computer.</p>
        </div>
      </div>
    </aside>
  );
}
import * as React from "react";
export function HealthScreen({
  health,
  checking,
  checkNow,
  ask,
  mock,
  cooling,
  coolingError,
  gpuNames,
  memory,
}: {
  health: Health | null;
  checking: boolean;
  checkNow: () => void;
  ask: (q: string) => void;
  mock: boolean;
  cooling: Cooling | null;
  coolingError: string;
  gpuNames: string[];
  memory: MemorySetup | null;
}) {
  const report = health?.report;
  if (!report)
    return (
      <div className="pending-state">
        <LoaderCircle className="spin" />
        <h2>Running the first health check…</h2>
        <p>This takes under a minute after the service starts.</p>
        <div className="skeleton-row">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  const checks = withMemoryCheck(report.checks, memory);
  const critical = checks.filter((c) => c.severity === "Critical");
  const warnings = checks.filter((c) => c.severity === "Warning");
  const problems = [...critical, ...warnings];
  const suggestions = checks.filter((c) => c.severity === "Info");
  const passed = checks.filter((c) => c.severity === null);
  const verdict = critical.length
    ? `${critical.length} serious problem${critical.length === 1 ? "" : "s"} need${critical.length === 1 ? "s" : ""} attention`
    : warnings.length
      ? `${warnings.length} thing${warnings.length === 1 ? "" : "s"} to look at`
      : "Your PC looks healthy";
  const Icon = critical.length ? ShieldAlert : warnings.length ? TriangleAlert : ShieldCheck;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR PC’S CHECK-UP</span>
          <h1>Health overview</h1>
          <p>A little attention now. A healthier PC ahead.</p>
        </div>
        <span className="heading-date">
          <Clock3 size={15} />
          {mock ? "Sample report" : `Updated ${relativeTime(report.atUtc)}`}
        </span>
      </div>
      <div className="health-layout">
        <div className="health-main">
          <section
            className={`verdict ${critical.length ? "critical" : warnings.length ? "warning" : "ok"}`}
          >
            <div className="verdict-top">
              <span className="verdict-icon">
                <Icon size={32} strokeWidth={1.6} />
              </span>
              <div>
                <span className="verdict-label">THE VERDICT</span>
                <h2>{verdict}</h2>
                <p>
                  Checked {relativeTime(report.atUtc, mock)}
                  <span>·</span>
                  {checks.length} checks
                </p>
              </div>
            </div>
            <div className="verdict-actions">
              <Button size="lg" onClick={checkNow} disabled={checking}>
                {checking ? <LoaderCircle className="spin" /> : <RefreshCw />}
                {checking ? "Checking…" : "Check now"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  ask("What does my latest health check mean, and what should I do first?")
                }
              >
                <Sparkles />
                Ask AI about it
                <ArrowUpRight />
              </Button>
            </div>
          </section>
          {problems.length > 0 && (
            <section className="check-section">
              <div className="section-heading">
                <h2>
                  Needs your attention <span className="count">{problems.length}</span>
                </h2>
                <span>Most important first</span>
              </div>
              <div className="problem-list">
                {problems.map((c) => (
                  <CheckCard key={c.id} check={c} ask={ask} />
                ))}
              </div>
            </section>
          )}
          {suggestions.length > 0 && (
            <section className="check-section">
              <div className="section-heading">
                <h2>A small suggestion</h2>
                <Info size={16} />
              </div>
              {suggestions.map((c) => (
                <CheckCard key={c.id} check={c} ask={ask} />
              ))}
            </section>
          )}
          <section className="passing-section">
            <div className="section-heading">
              <h2>
                Looking good <span className="count ok-count">{passed.length}</span>
              </h2>
              <ShieldCheck size={17} className="text-ok" />
            </div>
            <div className="passing-grid">
              {passed.map((c) => (
                <div key={c.id} className="passing-item">
                  <span>
                    <Check size={12} />
                  </span>
                  {c.title}
                </div>
              ))}
            </div>
            <details className="passing-details">
              <summary>
                What was checked
                <ChevronDown size={16} />
              </summary>
              <div>
                {passed.map((c) => (
                  <div className="passed-detail" key={c.id}>
                    <strong>{c.title}</strong>
                    <p>{c.summary}</p>
                    {c.evidence.map((e, i) => (
                      <p key={i}>{e}</p>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>
        <RightNow report={report} cooling={cooling} coolingError={coolingError} gpuNames={gpuNames} />
      </div>
    </>
  );
}
