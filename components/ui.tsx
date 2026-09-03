"use client";

import { useState } from "react";
import type {
  AuditType,
  ContactMethod,
  IcpVerdict,
  NextAction,
  RecommendedOfferType,
} from "@/lib/sales-brain/types";
import type { LeadRecord } from "@/lib/lead-record";

export function Section({
  title,
  children,
  accent = false,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-6 ${
        accent ? "border-accent/30 bg-accent-soft" : "border-border bg-surface"
      }`}
    >
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function BulletList({ items, tone = "default" }: { items: string[]; tone?: "default" | "positive" | "warning" }) {
  const markColor =
    tone === "positive" ? "text-success" : tone === "warning" ? "text-warning" : "text-accent";
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${markColor} bg-current`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard unavailable — no-op
        }
      }}
      className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

const VERDICT_STYLES: Record<IcpVerdict, string> = {
  HIGH_PRIORITY: "bg-success-soft text-success",
  MEDIUM: "bg-accent-soft text-accent",
  LOW: "bg-warning-soft text-warning",
  NOT_ICP: "bg-danger-soft text-danger",
};

const VERDICT_LABELS: Record<IcpVerdict, string> = {
  HIGH_PRIORITY: "High Priority",
  MEDIUM: "Medium",
  LOW: "Low",
  NOT_ICP: "Not ICP",
};

const INSTAGRAM_SOURCE_STYLES: Record<LeadRecord["instagramSource"], string> = {
  cache: "bg-[#e5e5ea] text-muted",
  live: "bg-success/15 text-success",
  mock: "bg-danger-soft text-danger",
};

const INSTAGRAM_SOURCE_LABELS: Record<LeadRecord["instagramSource"], string> = {
  cache: "Cached",
  live: "Live",
  mock: "Mock data",
};

export function InstagramSourceBadge({ source }: { source: LeadRecord["instagramSource"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${INSTAGRAM_SOURCE_STYLES[source]}`}>
      {INSTAGRAM_SOURCE_LABELS[source]}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: IcpVerdict }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${VERDICT_STYLES[verdict]}`}>
      {VERDICT_LABELS[verdict]}
    </span>
  );
}

const OFFER_STYLES: Record<RecommendedOfferType, string> = {
  LAUNCH: "bg-accent text-accent-foreground",
  GROWTH: "bg-success text-white",
  NONE: "bg-[#e5e5ea] text-muted",
};

const OFFER_LABELS: Record<RecommendedOfferType, string> = {
  LAUNCH: "XNINE Launch",
  GROWTH: "XNINE Growth",
  NONE: "None",
};

export function OfferBadge({ offer }: { offer: RecommendedOfferType }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${OFFER_STYLES[offer]}`}>
      {OFFER_LABELS[offer]}
    </span>
  );
}

const CONTACT_LABELS: Record<ContactMethod, string> = {
  CALL: "Call",
  INSTAGRAM_DM: "Instagram DM",
  TELEGRAM: "Telegram",
  EMAIL: "Email",
  UNKNOWN: "Unknown",
};

export function ContactMethodBadge({ method }: { method: ContactMethod }) {
  const style = method === "UNKNOWN" ? "bg-[#e5e5ea] text-muted" : "bg-accent-soft text-accent";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${style}`}>
      {CONTACT_LABELS[method]}
    </span>
  );
}

const AUDIT_LABELS: Record<AuditType, string> = {
  SHORT_AUDIT: "Short Audit",
  DEEP_AUDIT: "Deep Audit",
};

export function AuditBadge({ type }: { type: AuditType }) {
  const style = type === "DEEP_AUDIT" ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${style}`}>
      {AUDIT_LABELS[type]}
    </span>
  );
}

const NEXT_ACTION_LABELS: Record<NextAction, string> = {
  CALL: "Call",
  SEND_DM: "Send DM",
  SEND_AUDIT: "Send Audit",
  ASK_QUESTION: "Ask Question",
  BOOK_CALL: "Book Call",
  FOLLOW_UP: "Follow Up",
  DO_NOT_CONTACT: "Do Not Contact",
};

export function NextActionBadge({ action }: { action: NextAction }) {
  const style = action === "DO_NOT_CONTACT" ? "bg-danger-soft text-danger" : "bg-accent text-accent-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-base font-semibold ${style}`}>
      {NEXT_ACTION_LABELS[action]}
    </span>
  );
}

export function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("ru-RU").format(value);
}
