"use client";

import { useEffect, useState } from "react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { HistorySidebar } from "@/components/HistorySidebar";
import { LeadReport } from "@/components/LeadReport";
import { loadRecords, saveRecord } from "@/lib/client-storage";
import type { LeadRecord } from "@/lib/lead-record";

export default function Home() {
  const [records, setRecords] = useState<LeadRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from localStorage on mount
    setRecords(loadRecords());
  }, []);

  const selected = records.find((r) => r.id === selectedId) ?? null;

  async function handleAnalyze(username: string, forceRefresh = false) {
    setError(null);
    setLoading(true);
    setStageIndex(0);
    setSelectedId(null);

    const timers = [
      window.setTimeout(() => setStageIndex(1), 1500),
      window.setTimeout(() => setStageIndex(2), 4000),
      window.setTimeout(() => setStageIndex(3), 9000),
    ];

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, forceRefresh }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Не удалось выполнить анализ.");
      }

      const record = data as LeadRecord;
      const next = saveRecord(record);
      setRecords(next);
      setSelectedId(record.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка.");
    } finally {
      timers.forEach((t) => window.clearTimeout(t));
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full">
      <HistorySidebar
        records={records}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setError(null);
        }}
        onNew={() => {
          setSelectedId(null);
          setError(null);
        }}
      />

      <main className="flex-1 overflow-y-auto">
        {selected && !loading ? (
          <LeadReport
            record={selected}
            onRefreshInstagramData={() => handleAnalyze(selected.username, true)}
          />
        ) : (
          <AnalyzeForm
            loading={loading}
            stageIndex={stageIndex}
            error={error}
            onAnalyze={handleAnalyze}
          />
        )}
      </main>
    </div>
  );
}
