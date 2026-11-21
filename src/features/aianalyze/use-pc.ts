import { useCallback, useEffect, useRef, useState } from "react";
import { LocalApi } from "./api";
import type { Alert, Cooling, Health, Live, MemorySetup, Session, SessionDetail, Specs, Status } from "./types";
import { COOLING_POLL_MS } from "./cooling-rules";
import { MEMORY_POLL_MS } from "./memory-rules";
export function usePC(view: string, sessionId: number | null) {
  const api = useRef(new LocalApi()).current;
  const [ready, setReady] = useState(false);
  const [mock, setMock] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [specs, setSpecs] = useState<Specs | null>(null);
  const [cooling, setCooling] = useState<Cooling | null>(null);
  const [coolingError, setCoolingError] = useState("");
  const [memory, setMemory] = useState<MemorySetup | null>(null);
  const [memoryError, setMemoryError] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlerts, setNewAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [checking, setChecking] = useState(false);
  const alertsInitialized = useRef(false);
  const lastId = useRef(0);
  const previousReport = useRef<string | null>(null);
  const hardwareLoadedAt = useRef(0);
  useEffect(() => {
    let cancelled = false;
    api
      .initialize(new URLSearchParams(window.location.search).get("mock") === "1")
      .then((result) => {
        if (cancelled) return;
        setStatus(result);
        setMock(api.mock);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    const poll = async () => {
      if (document.hidden || stopped) return;
      try {
        const value = await api.get<Status>("/api/status");
        if (!stopped) {
          setStatus(value);
          setError("");
        }
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : "Service not reachable");
      }
    };
    const alertPoll = async () => {
      if (document.hidden || stopped) return;
      try {
        const items = await api.get<Alert[]>(`/api/alerts?after=${lastId.current}`);
        if (stopped) return;
        if (items.length) {
          lastId.current = Math.max(lastId.current, ...items.map((a) => a.id));
          setAlerts((old) => [...items, ...old].slice(0, 200));
          if (alertsInitialized.current) {
            setUnread((n) => n + items.length);
            setNewAlerts(items);
          }
        }
        alertsInitialized.current = true;
      } catch {
        /* Status polling owns the service-level error. */
      }
    };
    void poll();
    void alertPoll();
    const s = setInterval(poll, 5000);
    const a = setInterval(alertPoll, 10000);
    const visible = () => {
      if (!document.hidden) {
        void poll();
        void alertPoll();
      }
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      clearInterval(s);
      clearInterval(a);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [ready, api]);
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    setPageError("");
    if (sessionId !== null) setDetail(null);
    const load = async () => {
      if (document.hidden || stopped) return;
      try {
        if (view === "health") {
          const value = await api.get<Health>("/api/health");
          if (stopped) return;
          setHealth(value);
          if (checking && value.report?.atUtc !== previousReport.current && !value.running)
            setChecking(false);
        }
        if (view === "live" || view === "system") {
          const value = await api.get<Live>("/api/live?minutes=5");
          if (!stopped) setLive(value);
        }
        if (view === "sessions" && sessionId === null) {
          const value = await api.get<Session[]>("/api/sessions?limit=200");
          if (!stopped) setSessions(value);
        }
        if (view === "sessions" && sessionId !== null) {
          const value = await api.get<SessionDetail>(`/api/sessions/${sessionId}`);
          if (!stopped) setDetail(value);
        }
        if ((view === "system" || view === "live" || view === "health") && Date.now() - hardwareLoadedAt.current >= 30000) {
          const value = await api.get<Specs>("/api/specs");
          if (!stopped) {
            hardwareLoadedAt.current = Date.now();
            setSpecs(value);
          }
        }
        if (!stopped) setPageError("");
      } catch (e) {
        if (!stopped) setPageError(e instanceof Error ? e.message : "Measurements could not load.");
      }
    };
    void load();
    const interval = setInterval(
      load,
      view === "live" || view === "system" || (view === "health" && checking) ? 2000 : 30000,
    );
    const visible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [ready, view, sessionId, checking, api]);
  useEffect(() => {
    if (!ready || !["health", "live", "system"].includes(view)) return;
    let stopped = false;
    let pending = false;
    const poll = async () => {
      if (document.hidden || stopped || pending) return;
      pending = true;
      try {
        const value = await api.cooling();
        if (!stopped) { setCooling(value); setCoolingError(""); }
      } catch (e) {
        if (!stopped) { setCooling(null); setCoolingError(e instanceof Error ? e.message : "Cooling readings are temporarily unavailable."); }
      } finally { pending = false; }
    };
    void poll();
    const interval = setInterval(poll, COOLING_POLL_MS);
    const visible = () => { if (!document.hidden) void poll(); };
    document.addEventListener("visibilitychange", visible);
    return () => { stopped = true; clearInterval(interval); document.removeEventListener("visibilitychange", visible); };
  }, [ready, view, api]);
  useEffect(() => {
    if (!ready || !["health", "system"].includes(view)) return;
    let stopped = false;
    let pending = false;
    const poll = async () => {
      if (stopped || pending || document.hidden) return;
      pending = true;
      try {
        const value = await api.memory();
        if (!stopped) { setMemory(value); setMemoryError(""); }
      } catch (e) {
        if (!stopped) { setMemory(null); setMemoryError(e instanceof Error ? e.message : "Memory setup is temporarily unavailable."); }
      } finally { pending = false; }
    };
    void poll();
    const interval = setInterval(poll, MEMORY_POLL_MS);
    const visible = () => { if (!document.hidden) void poll(); };
    document.addEventListener("visibilitychange", visible);
    return () => { stopped = true; clearInterval(interval); document.removeEventListener("visibilitychange", visible); };
  }, [ready, view, health?.report?.atUtc, api]);
  const checkNow = useCallback(async () => {
    previousReport.current = health?.report?.atUtc || null;
    setChecking(true);
    try {
      await api.check();
      const value = await api.get<Health>("/api/health");
      setHealth(value);
      if (!value.running && value.report?.atUtc !== previousReport.current) setChecking(false);
    } catch (e) {
      setChecking(false);
      setPageError(e instanceof Error ? e.message : "The health check could not start.");
    }
  }, [api, health]);
  return {
    api,
    ready,
    mock,
    status,
    health,
    live,
    sessions,
    detail,
    specs,
    cooling,
    coolingError,
    memory,
    memoryError,
    alerts,
    newAlerts,
    unread,
    error,
    pageError,
    checking: checking || Boolean(health?.running),
    checkNow,
    markRead: () => setUnread(0),
  };
}
