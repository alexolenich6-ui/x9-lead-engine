"use client";

import type { LeadRecord } from "@/lib/lead-record";
import { VerdictBadge, OfferBadge } from "./ui";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function HistorySidebar({
  records,
  selectedId,
  onSelect,
  onNew,
}: {
  records: LeadRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-5">
        <div className="text-base font-semibold tracking-tight">X9 Lead Engine</div>
        <div className="mt-0.5 text-xs text-muted-2">XNINE internal tool</div>
      </div>

      <div className="px-4 py-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          + New analysis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {records.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-2">
            История пуста. Проанализируйте первый лид.
          </div>
        ) : (
          <ul className="space-y-1">
            {records.map((record) => {
              const active = record.id === selectedId;
              return (
                <li key={record.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(record.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      active ? "bg-accent-soft" : "hover:bg-surface-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        @{record.username}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-muted-2">
                        {record.analysis.icp.totalScore}
                      </span>
                    </div>
                    {record.profile.fullName !== "unknown" && (
                      <div className="truncate text-xs text-muted-2">{record.profile.fullName}</div>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="scale-90 origin-left">
                        <VerdictBadge verdict={record.analysis.icp.verdict} />
                      </span>
                      <span className="scale-90 origin-left">
                        <OfferBadge offer={record.analysis.recommendedOffer.offer} />
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-2">{formatDate(record.analyzedAt)}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
