import { useEffect, useRef, useState, type ReactNode } from "react";
import { Portal } from "@radix-ui/react-hover-card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function DetailReveal({ trigger, children, label, className = "" }: { trigger: ReactNode; children: ReactNode; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const dismissed = useRef(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { dismissed.current = true; setOpen(false); } };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return <HoverCard open={open} onOpenChange={value => { if (!value || !dismissed.current) setOpen(value); }} openDelay={120} closeDelay={160}>
    <HoverCardTrigger asChild onPointerEnter={() => { dismissed.current = false; }} onFocus={() => { if (!dismissed.current) setOpen(true); }} onBlur={(event) => {
      dismissed.current = false;
      if (!(event.relatedTarget instanceof Element) || !event.relatedTarget.closest("[data-hardware-details]")) setOpen(false);
    }} onClick={() => { dismissed.current = false; setOpen(true); }} onKeyDown={event => { if (event.key === "Escape") { dismissed.current = true; setOpen(false); } }}>{trigger}</HoverCardTrigger>
    <Portal><HoverCardContent data-hardware-details align="center" side="top" collisionPadding={16} className={`hardware-detail-popover ${className}`} role="region" aria-label={label} onKeyDown={event => { if (event.key === "Escape") { dismissed.current = true; setOpen(false); } }}>
      {children}
    </HoverCardContent></Portal>
  </HoverCard>;
}