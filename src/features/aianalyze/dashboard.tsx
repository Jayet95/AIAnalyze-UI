import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bell,
  Check,
  Gamepad2,
  HeartPulse,
  Info,
  Monitor,
  ShieldCheck,
  Sparkles,
  X,
  ArrowUpRight,
  TriangleAlert,
  Cpu,
  Radio,
  Gauge,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatDrawer, type ChatContext } from "./chat";
import { HealthScreen } from "./health";
import { LiveScreen, SessionsScreen, SystemScreen } from "./screens";
import { captureLabel, relativeTime } from "./rules";
import { usePC } from "./use-pc";
import type { Alert } from "./types";
import { AccountControl, LocalServiceProvider, PrivacyBanner, PrivacySettings, useServicePreferences } from "./service-preferences";
const tabs = [
  { id: "health", label: "Health", Icon: HeartPulse, href: "#/" },
  { id: "live", label: "Live", Icon: Activity, href: "#/live" },
  { id: "sessions", label: "Sessions", Icon: Gamepad2, href: "#/sessions" },
  { id: "system", label: "System", Icon: Monitor, href: "#/system" },
];
function parseHash() {
  const parts = window.location.hash.replace(/^#\//, "").split("/");
  return {
    view: tabs.some((t) => t.id === parts[0]) ? parts[0] || "health" : "health",
    id: parts[0] === "sessions" && parts[1] && /^\d+$/.test(parts[1]) ? Number(parts[1]) : null,
  };
}
export function Dashboard() {
  const [location, setLocation] = useState({ view: "health", id: null as number | null });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext>({ sessionId: null, question: "" });
  const [toasts, setToasts] = useState<Alert[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [rgbEnabled, setRgbEnabled] = useState(true);
  const pc = usePC(location.view, location.id);
  const prefs = useServicePreferences(pc.api, pc.ready);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => toastTimers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const update = () => {
      setLocation(parseHash());
      window.scrollTo({ top: 0 });
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title = `${tabs.find((t) => t.id === location.view)?.label || "Health"} · AIAnalyze`;
  }, [location.view]);
  useEffect(() => {
    if (!pc.newAlerts.length) return;
    const incoming = pc.newAlerts;
    setToasts((old) => [...incoming, ...old]);
    const timer = setTimeout(
      () => setToasts((old) => old.filter((a) => !incoming.some((n) => n.id === a.id))),
      20000,
    );
    toastTimers.current.push(timer);
  }, [pc.newAlerts]);
  const ask = (question = "", sessionId: number | null = null) => {
    setChatContext({ question, sessionId });
    setChatOpen(true);
    setBellOpen(false);
  };
  const alertAsk = (a: Alert) => {
    ask(`Explain this alert and what I should do: ${a.message}`, a.sessionId);
    setToasts((old) => old.filter((t) => t.id !== a.id));
  };
  const state = pc.status?.capture.state;
  const statusTone = pc.error
    ? "critical"
    : state === "Running"
      ? "ok"
      : state === "Disabled"
        ? "neutral"
        : "warning";
  return (
    <LocalServiceProvider api={pc.api}><div className={`app-shell desktop-console ${rgbEnabled ? "rgb-enabled" : "rgb-disabled"}`}>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/" aria-label="AIAnalyze health home">
            <span className="brand-mark">
              <Gauge size={24} strokeWidth={1.8} />
            </span>
            <span>
              AI<span className="brand-light">Analyze</span>
            </span>
          </a>
          <span className="console-title">CONTROL CENTER <span>/ {location.view.toUpperCase()}</span></span>
          <div className="topbar-actions">
            <Button variant="ghost" size="icon" className="rgb-control" aria-label="RGB lighting" aria-pressed={rgbEnabled} title="RGB lighting" onClick={() => setRgbEnabled((enabled) => !enabled)}>
              <Palette size={18} />
            </Button>
            <span className={`status-pill ${statusTone}`} title={pc.status?.capture.message}>
              <i />
              {pc.error ? "Service not reachable" : state ? captureLabel(state) : "Connecting…"}
            </span>
            <Popover
              open={bellOpen}
              onOpenChange={(open) => {
                setBellOpen(open);
                if (open) pc.markRead();
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Alerts${pc.unread ? `, ${pc.unread} unread` : ""}`}
                  className="bell-button"
                >
                  <Bell size={19} />
                  {pc.unread > 0 && <span className="bell-count">{pc.unread}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="alerts-popover">
                <div className="section-heading">
                  <h3>Notifications</h3>
                  <span>{pc.alerts.length}</span>
                </div>
                {pc.alerts.length === 0 ? (
                  <div className="no-alerts">
                    <Check />
                    <p>You’re all caught up.</p>
                  </div>
                ) : (
                  <div className="alerts-list">
                    {pc.alerts.map((a) => (
                      <article
                        key={a.id}
                        className={`alert-item ${a.severity?.toLowerCase() || "info"}`}
                      >
                        <span className="alert-dot" />
                        <div>
                          <p>{a.message}</p>
                          <small>{relativeTime(a.atUtc, pc.mock)}</small>
                          <Button variant="link" size="sm" onClick={() => alertAsk(a)}>
                            <Sparkles />
                            Ask about this
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <AccountControl prefs={prefs} mock={pc.mock} />
            <Button className="ask-ai-button" onClick={() => ask()}>
              <Sparkles size={17} />
              <span>Ask AI</span>
            </Button>
          </div>
        </div>
      </header>
      <aside className="console-sidebar">
        <span className="sidebar-caption">WORKSPACE</span>
        <nav className="main-nav" aria-label="Main navigation">
          {tabs.map((t, index) => (
            <Button key={t.id} variant="ghost" asChild className={`nav-tab ${location.view === t.id ? "active" : ""}`}>
              <a href={t.href} aria-current={location.view === t.id ? "page" : undefined}>
                <t.Icon size={19} /><span>{t.label}</span><small>0{index + 1}</small>
              </a>
            </Button>
          ))}
        </nav>
        <div className="sidebar-machine"><Cpu size={26} /><strong>LOCAL MACHINE</strong><span>PC / 01</span><span className="sidebar-source"><i />{pc.mock ? "DEMO MODE" : "LOCAL SERVICE"}</span></div>
        <div className="rgb-spectrum" aria-hidden="true" />
      </aside>
      <main className="main-content">
        <div className="performance-ribbon">
          <span>
            <Cpu size={15} />
            <strong>PERFORMANCE CONTROL</strong>
            <span>/ {location.view.toUpperCase()}</span>
          </span>
          <span>
            <Radio size={14} />
            {pc.mock ? "DEMO TELEMETRY" : "LOCAL TELEMETRY"}
            <span className="signal-bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </span>
          <span>
            AIAnalyze <strong>PC / 01</strong>
          </span>
        </div>
        {pc.mock && (
          <div className="sample-banner">
            <Info size={15} />
            <span>Sample PC data</span>
            <span className="sample-banner-detail">
              Local service isn’t connected in this preview.
            </span>
          </div>
        )}
        {pc.error ? (
          <section className="service-error">
            <TriangleAlert size={44} />
            <h1>Service not reachable</h1>
            <p>AIAnalyze service isn’t running. Start it from Services, or reinstall.</p>
            <Button onClick={() => window.location.reload()}>Try again</Button>
          </section>
        ) : (
          <>
            {pc.pageError && (
              <div className="page-error" role="alert">
                <TriangleAlert size={18} />
                {pc.pageError}
              </div>
            )}
            {location.view === "health" && (
              <><PrivacyBanner prefs={prefs} /><HealthScreen
                health={pc.health}
                checking={pc.checking}
                checkNow={() => void pc.checkNow()}
                ask={(q) => ask(q)}
                mock={pc.mock}
                cooling={pc.cooling}
                coolingError={pc.coolingError}
                gpuNames={pc.specs?.gpus.map(gpu => gpu.name) ?? []}
                memory={pc.memory}
              /></>
            )}{" "}
            {location.view === "live" && <LiveScreen live={pc.live} status={pc.status} specs={pc.specs} cooling={pc.cooling} coolingError={pc.coolingError} />}{" "}
            {location.view === "sessions" && pc.pageError && location.id !== null ? (
              <Button variant="ghost" asChild>
                <a href="#/sessions">Back to all sessions</a>
              </Button>
            ) : (
              location.view === "sessions" && (
                <SessionsScreen
                  sessions={pc.sessions}
                  detail={pc.detail}
                  id={location.id}
                  status={pc.status}
                  ask={ask}
                />
              )
            )}{" "}
            {location.view === "system" && <SystemScreen specs={pc.specs} live={pc.live} cooling={pc.cooling} memory={pc.memory} memoryError={pc.memoryError} ask={ask} />}
          </>
        )}
        <footer className="app-footer">
          <span>
            <ShieldCheck size={14} />
            AIAnalyze · PC / 01
          </span>
          <span>
            {pc.mock
              ? "Sample measurements"
              : `Sensors ${relativeTime(pc.status?.lastSampleUtc || null)}`}
            <i />
            Local connection
          </span>
        </footer>
      </main>
      <ChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        context={chatContext}
        api={pc.api}
        mock={pc.mock}
        refreshAccount={prefs.refreshAccount}
      />
      <PrivacySettings prefs={prefs} />
      <div className="toast-stack" aria-live="polite">
        {prefs.notice && <article className="alert-toast info"><div className="toast-heading"><UserNotice text={prefs.notice} /><Button variant="ghost" size="icon" aria-label="Dismiss account notification" onClick={() => prefs.setNotice("")}><X size={15} /></Button></div></article>}
        {toasts.map((a) => (
          <article key={a.id} className={`alert-toast ${a.severity?.toLowerCase() || "info"}`}>
            <div className="toast-heading">
              <Bell size={16} />
              <strong>PC health update</strong>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Dismiss alert"
                onClick={() => setToasts((old) => old.filter((t) => t.id !== a.id))}
              >
                <X size={15} />
              </Button>
            </div>
            <p>{a.message}</p>
            <Button variant="link" size="sm" onClick={() => alertAsk(a)}>
              <Sparkles />
              Ask about this
              <ArrowUpRight />
            </Button>
          </article>
        ))}
      </div>
    </div></LocalServiceProvider>
  );
}
function UserNotice({ text }: { text: string }) { return <p>{text}</p>; }
