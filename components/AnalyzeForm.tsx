"use client";

import { useState } from "react";

const STAGES = [
  "Collecting profile",
  "Collecting Reels",
  "Analyzing content",
  "Building sales intelligence",
];

export function AnalyzeForm({
  loading,
  stageIndex,
  error,
  onAnalyze,
}: {
  loading: boolean;
  stageIndex: number;
  error: string | null;
  onAnalyze: (username: string) => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onAnalyze(trimmed);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">X9 Lead Engine</h1>
        <p className="mt-2 text-sm text-muted">
          Вставьте Instagram username лида — остальное сделает система.
        </p>

        <div className="mt-8 flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="@enotbuilding"
            disabled={loading}
            className="h-12 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-2 focus:border-accent disabled:opacity-60"
          />
          <button
            type="button"
            onClick={submit}
            disabled={loading || !value.trim()}
            className="h-12 shrink-0 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Analyzing…" : "Analyze Lead"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-left text-sm text-danger">
            {error}
          </div>
        )}

        {loading && (
          <ol className="mt-8 space-y-2.5 text-left">
            {STAGES.map((stage, i) => {
              const done = i < stageIndex;
              const active = i === stageIndex;
              return (
                <li key={stage} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      done
                        ? "bg-success text-white"
                        : active
                          ? "bg-accent text-accent-foreground"
                          : "bg-[#ececef] text-muted-2"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={done || active ? "text-foreground" : "text-muted-2"}>
                    {stage}
                    {active && <span className="animate-pulse">…</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
