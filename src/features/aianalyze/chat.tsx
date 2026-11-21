import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Plus, Square, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Markdown } from "./markdown";
import type { LocalApi } from "./api";
import type { Message } from "./types";
export type ChatContext = { sessionId: number | null; question: string };
const suggestions = [
  "Is anything wrong with my PC right now?",
  "Why is my PC slow?",
  "Has my PC crashed recently, and why?",
  "Are my temperatures OK?",
  "Why did my FPS drop in the last game?",
];
export function ChatDrawer({
  open,
  onOpenChange,
  context,
  api,
  mock,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ChatContext;
  api: LocalApi;
  mock: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("aianalyze-chat");
      if (raw) {
        const list: unknown = JSON.parse(raw);
        if (Array.isArray(list))
          setMessages(
            list
              .filter(
                (m): m is Message =>
                  typeof m === "object" &&
                  m !== null &&
                  "role" in m &&
                  "content" in m &&
                  (m.role === "user" || m.role === "assistant") &&
                  typeof m.content === "string",
              )
              .slice(-20),
          );
      }
    } catch {}
    setLoaded(true);
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        sessionStorage.setItem("aianalyze-chat", JSON.stringify(messages));
      } catch {}
  }, [messages, loaded]);
  useEffect(() => {
    if (!open) return;
    let stopped = false;
    setConfigured(null);
    setDraft(context.question);
    setError("");
    api
      .get<{ configured: boolean }>("/api/chat/status")
      .then((s) => {
        if (!stopped) setConfigured(s.configured);
      })
      .catch((e) => {
        if (!stopped) setError(e instanceof Error ? e.message : "Assistant unavailable");
      });
    return () => {
      stopped = true;
    };
  }, [open, context, api]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, open]);
  async function send(question = draft) {
    if (!configured || streaming || !question.trim()) return;
    const next: Message[] = [
      ...messages.filter((m) => m.content.trim()).slice(-19),
      { role: "user", content: question.trim() },
    ];
    if (next.length > 20 || question.trim().length > 4000) {
      setError("Questions must be 1–4,000 characters.");
      return;
    }
    setMessages([...next, { role: "assistant", content: "" }]);
    setDraft("");
    setError("");
    setStreaming(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      await api.chat(next, context.sessionId, abort.signal, (text) => {
        if (!abort.signal.aborted && controller.current === abort)
          setMessages((old) =>
            old.map((m, i) => (i === old.length - 1 ? { ...m, content: m.content + text } : m)),
          );
      });
    } catch (e) {
      if (!abort.signal.aborted)
        setError(e instanceof Error ? e.message : "The answer was interrupted.");
    } finally {
      if (controller.current === abort) {
        setStreaming(false);
        controller.current = null;
      }
    }
  }
  function newChat() {
    controller.current?.abort();
    controller.current = null;
    setMessages([]);
    setStreaming(false);
    setError("");
    setDraft("");
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="assistant-drawer">
        <SheetHeader>
          <div className="assistant-title">
            <span className="assistant-mark">
              <Sparkles size={20} />
            </span>
            <SheetTitle>Ask AIAnalyze</SheetTitle>
          </div>
          <SheetDescription>
            {context.sessionId !== null
              ? `Includes session ${context.sessionId} in detail`
              : "Uses this PC’s measurements"}
          </SheetDescription>
        </SheetHeader>
        <div className="chat-tools">
          <span>
            <ShieldCheck size={14} />{" "}
            {mock ? "Sample conversation" : "Measurements stay on this PC"}
          </span>
          <Button variant="ghost" size="sm" onClick={newChat}>
            <Plus />
            New
          </Button>
        </div>
        <div className="chat-scroll">
          {configured === false ? (
            <div className="setup-message">
              <Sparkles />
              <h3>Your assistant is almost ready</h3>
              <p>
                The assistant needs your own Anthropic API key. Rerun the installer as Administrator
                with <code>-SetApiKey</code> and paste your key when asked. The key stays on this PC
                in a file only Windows administrators can read.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <div className="assistant-mark large">
                <Sparkles />
              </div>
              <h3>A little clarity for your PC.</h3>
              <p>Ask about your PC’s health, temperatures, or a recent game.</p>
              <div className="chat-suggestions">
                {suggestions.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    onClick={() => void send(q)}
                    disabled={!configured}
                  >
                    {q}
                    <ArrowUpRight />
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.role}`} dir="auto">
                <span className="message-author">{m.role === "user" ? "You" : "AIAnalyze"}</span>
                <Markdown text={m.content} />
                {streaming && i === messages.length - 1 && <span className="stream-caret" />}
              </div>
            ))
          )}
          {error && (
            <div className="chat-error" role="alert">
              {error}
            </div>
          )}
          <div ref={bottom} />
        </div>
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            aria-label="Your question"
            placeholder={
              configured === false ? "Set up your API key to ask a question" : "Ask about your PC…"
            }
            value={draft}
            maxLength={4000}
            disabled={!configured}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          {streaming ? (
            <Button
              type="button"
              size="icon"
              title="Stop answer"
              aria-label="Stop answer"
              onClick={() => {
                controller.current?.abort();
                setStreaming(false);
              }}
            >
              <Square />
            </Button>
          ) : (
            <Button size="icon" aria-label="Send question" disabled={!configured || !draft.trim()}>
              <Send />
            </Button>
          )}
        </form>
        <p className="chat-disclaimer">
          AI can make mistakes. Back up important files before making changes.
        </p>
      </SheetContent>
    </Sheet>
  );
}
