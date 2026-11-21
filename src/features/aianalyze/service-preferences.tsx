import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LogOut, Settings, ShieldCheck, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { LocalApi } from "./api";
import type { Account, FeedbackVote, Privacy } from "./types";

const ServiceContext = createContext<LocalApi | null>(null);
export function LocalServiceProvider({ api, children }: { api: LocalApi; children: ReactNode }) {
  return <ServiceContext.Provider value={api}>{children}</ServiceContext.Provider>;
}
export function FeedbackButtons({ target, kind }: { target: FeedbackVote["target"]; kind: string }) {
  const api = useContext(ServiceContext);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!api) return null;
  const vote = async (helpful: boolean) => {
    if (pending || saved) return;
    setPending(true); setError("");
    try { await api.feedback({ target, kind, helpful }); setSaved(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Feedback could not be saved."); }
    finally { setPending(false); }
  };
  return <div className="feedback-vote" aria-label="Feedback" aria-live="polite">{saved ? <span>Thanks for the feedback</span> : <><span>Helpful?</span><Button variant="ghost" size="icon" aria-label="Helpful" title="Helpful" disabled={pending} onClick={() => void vote(true)}><ThumbsUp size={14} /></Button><Button variant="ghost" size="icon" aria-label="Not helpful" title="Not helpful" disabled={pending} onClick={() => void vote(false)}><ThumbsDown size={14} /></Button></>}{error && <span role="alert">{error}</span>}</div>;
}

export const privacyExplanation = "Share anonymous diagnostics: hardware models, driver versions, which checks failed and how games ran. Never names of your files or programs, never chat content.";
export function useServicePreferences(api: LocalApi, ready: boolean) {
  const [account, setAccount] = useState<Account | null>(null);
  const [privacy, setPrivacy] = useState<Privacy | null>(null);
  const [settings, setSettings] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = async () => {
    const [a, p] = await Promise.all([api.get<Account>("/api/account"), api.get<Privacy>("/api/privacy")]);
    setAccount(a); setPrivacy(p); setError("");
    return a;
  };
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const [a, p] = await Promise.all([api.get<Account>("/api/account"), api.get<Privacy>("/api/privacy")]);
        if (stopped) return;
        setAccount(a); setPrivacy(p); setError("");
        if (window.location.hash === "#signed-in") {
          if (a.signedIn) setNotice(`Signed in as ${a.name || a.email || "your account"}`);
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          window.dispatchEvent(new Event("hashchange"));
        }
      } catch (e) { if (!stopped) setError(e instanceof Error ? e.message : "Settings could not load."); }
    };
    void load();
    const visible = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { stopped = true; document.removeEventListener("visibilitychange", visible); };
  }, [api, ready]);
  const save = async (share: boolean) => {
    if (busy) return;
    setBusy(true); setError("");
    try { await api.savePrivacy(share); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Your privacy choice could not be saved."); }
    finally { setBusy(false); }
  };
  const signOut = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try { await api.signOut(); await refresh(); setNotice("Signed out"); }
    catch (e) { setError(e instanceof Error ? e.message : "Sign out failed."); }
    finally { setBusy(false); }
  };
  return { account, privacy, settings, setSettings, preview, setPreview, busy, error, notice, setNotice, save, signOut, refreshAccount: () => { void refresh().catch(e => setError(e instanceof Error ? e.message : "Account could not refresh.")); }, openSettings: (expanded = false) => { setPreview(expanded); setSettings(true); void refresh().catch(e => setError(e instanceof Error ? e.message : "Settings could not load.")); } };
}
export type Preferences = ReturnType<typeof useServicePreferences>;

export function SignInLink({ mock }: { mock: boolean }) {
  return mock ? <Button disabled title="Sign-in is available in the installed PC app">Sign in · local app only</Button> : <Button asChild><a href="/auth/sign-in">Sign in</a></Button>;
}
export function AccountControl({ prefs, mock }: { prefs: Preferences; mock: boolean }) {
  const account = prefs.account;
  if (account && !account.signInConfigured) return <Button className="account-control" variant="ghost" size="icon" aria-label="Settings" title="Settings" onClick={() => prefs.openSettings()}><Settings size={18} /></Button>;
  if (account && !account.signedIn && account.signInConfigured) return <span className="account-control"><SignInLink mock={mock} /></span>;
  if (!account?.signedIn) return <Button className="account-control" variant="ghost" size="icon" aria-label="Settings" title="Settings" onClick={() => prefs.openSettings()}><Settings size={18} /></Button>;
  return <Popover><PopoverTrigger asChild><Button variant="ghost" className="account-control" aria-label="Account menu"><UserRound size={17} /><span>{account.name || account.email}</span></Button></PopoverTrigger><PopoverContent align="end" className="account-menu"><strong>{account.name || "Account"}</strong><p>{account.email}</p>{account.quota && <div className="account-quota"><span>Assistant questions today {account.quota.questionsToday} of {account.quota.dailyLimit}</span><progress max={Math.max(1, account.quota.dailyLimit)} value={account.quota.questionsToday} /></div>}<Button variant="ghost" onClick={() => prefs.openSettings()}><Settings />Settings</Button><Button variant="ghost" disabled={prefs.busy} onClick={() => void prefs.signOut()}><LogOut />Sign out</Button>{prefs.error && <p role="alert">{prefs.error}</p>}</PopoverContent></Popover>;
}
export function PrivacyBanner({ prefs }: { prefs: Preferences }) {
  if (prefs.privacy?.consent !== null) return null;
  return <section className="privacy-banner" aria-label="Diagnostics consent"><ShieldCheck size={22} /><div><h2>Help make AIAnalyze better?</h2><p>{privacyExplanation}</p>{prefs.error && <p role="alert">{prefs.error}</p>}<div className="privacy-actions"><Button variant="ghost" size="sm" onClick={() => prefs.openSettings(true)}>What is shared?</Button><Button variant="outline" size="sm" disabled={prefs.busy} onClick={() => void prefs.save(false)}>No thanks</Button><Button size="sm" disabled={prefs.busy} onClick={() => void prefs.save(true)}>Share</Button></div></div></section>;
}
export function PrivacySettings({ prefs }: { prefs: Preferences }) {
  return <Dialog open={prefs.settings} onOpenChange={prefs.setSettings}><DialogContent className="privacy-settings"><DialogHeader><DialogTitle>Settings</DialogTitle><DialogDescription>Privacy and anonymous diagnostics</DialogDescription></DialogHeader>{prefs.privacy ? <><div className="privacy-switch-row"><label htmlFor="diagnostics-sharing">Share anonymous diagnostics to help improve AIAnalyze</label><Switch id="diagnostics-sharing" checked={prefs.privacy.consent === true} disabled={prefs.busy} onCheckedChange={share => void prefs.save(share)} /></div><p>{privacyExplanation}</p>{!prefs.privacy.serverConfigured && <p className="privacy-local-note"><ShieldCheck size={17} />This build has no server set up yet, so nothing is sent</p>}<details open={prefs.preview} onToggle={e => prefs.setPreview(e.currentTarget.open)}><summary>Show exactly what is shared</summary><pre>{JSON.stringify(prefs.privacy.preview, null, 2)}</pre></details></> : <p>Privacy settings are not available yet.</p>}{prefs.error && <p role="alert">{prefs.error}</p>}</DialogContent></Dialog>;
}