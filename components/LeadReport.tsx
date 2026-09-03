"use client";

import type { LeadRecord } from "@/lib/lead-record";
import {
  AuditBadge,
  BulletList,
  ContactMethodBadge,
  CopyButton,
  InstagramSourceBadge,
  NextActionBadge,
  OfferBadge,
  Section,
  VerdictBadge,
  formatNumber,
} from "./ui";

export function LeadReport({
  record,
  onRefreshInstagramData,
}: {
  record: LeadRecord;
  onRefreshInstagramData?: () => void;
}) {
  const { profile, contentStats, analysis } = record;

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-surface p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-xl font-semibold text-foreground">
              {profile.fullName !== "unknown" ? profile.fullName : `@${profile.username}`}
            </div>
            <div className="mt-1 text-sm text-muted">@{profile.username}</div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span>
                <span className="font-semibold text-foreground">
                  {formatNumber(profile.followersCount)}
                </span>{" "}
                followers
              </span>
              <span>
                {profile.businessCategoryName !== "unknown"
                  ? profile.businessCategoryName
                  : "категория неизвестна"}
              </span>
              {profile.isBusinessAccount === true && <span>Business account</span>}
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {analysis.icp.totalScore}
              <span className="text-lg font-medium text-muted-2">/100</span>
            </div>
            <div className="mt-1">
              <VerdictBadge verdict={analysis.icp.verdict} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-2">
            <InstagramSourceBadge source={record.instagramSource} />
            <span>
              Instagram-данные от {new Date(record.instagramFetchedAt).toLocaleString("ru-RU")}
            </span>
          </div>
          {onRefreshInstagramData && (
            <button
              type="button"
              onClick={onRefreshInstagramData}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Refresh Instagram Data
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-2">
            Recommended
          </span>
          <OfferBadge offer={analysis.recommendedOffer.offer} />
          <span className="text-sm text-muted">{analysis.recommendedOffer.reasoning}</span>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-foreground/90">{analysis.leadSummary}</p>
      </div>

      {/* ICP breakdown */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          ICP Breakdown
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {analysis.icp.scores.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="text-muted-2">{item.score}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#ececef]">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
                />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <Section title="Primary Sales Angle" accent>
          <p className="text-[15px] leading-relaxed text-foreground">{analysis.primarySalesAngle}</p>
        </Section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Section title="Existing Strengths">
            <BulletList items={analysis.existingStrengths} tone="positive" />
          </Section>

          <Section title="Marketing Gaps">
            <BulletList items={analysis.marketingGaps} tone="warning" />
          </Section>
        </div>

        <Section title="Content Performance">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Reels analyzed" value={String(contentStats.reelsAnalyzed)} />
            <Stat label="Min views" value={formatNumber(contentStats.min)} />
            <Stat label="Median views" value={formatNumber(contentStats.median)} />
            <Stat label="Max views" value={formatNumber(contentStats.max)} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-2">
                Strong topics
              </div>
              {analysis.contentAnalysis.strongTopics.length > 0 ? (
                <BulletList items={analysis.contentAnalysis.strongTopics} tone="positive" />
              ) : (
                <div className="mt-2 text-sm text-muted-2">—</div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-2">
                Weak topics
              </div>
              {analysis.contentAnalysis.weakTopics.length > 0 ? (
                <BulletList items={analysis.contentAnalysis.weakTopics} tone="warning" />
              ) : (
                <div className="mt-2 text-sm text-muted-2">—</div>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted">
            {analysis.contentAnalysis.varianceDescription}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            <span className="font-medium">Гипотеза о релевантности аудитории: </span>
            {analysis.contentAnalysis.relevanceToCoreServiceHypothesis}
          </p>
        </Section>

        <Section title="What Not To Say">
          <BulletList items={analysis.whatNotToSay} tone="warning" />
        </Section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Section title="Best Contact Method">
            <ContactMethodBadge method={analysis.bestContactMethod.method} />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {analysis.bestContactMethod.reasoning}
            </p>
          </Section>

          <Section title="Audit Recommendation">
            <AuditBadge type={analysis.auditRouting.type} />
            <p className="mt-3 text-sm leading-relaxed text-muted">{analysis.auditRouting.reasoning}</p>
            <ul className="mt-3 list-decimal space-y-1 pl-4 text-sm text-foreground">
              {analysis.auditRouting.structure.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </Section>
        </div>

        <Section title="First Outreach">
          <div className="space-y-4">
            <OutreachBlock label="Cold-call opener" text={analysis.firstOutreach.coldCallOpener} />
            <OutreachBlock label="Instagram DM" text={analysis.firstOutreach.instagramDm} />
            {analysis.firstOutreach.telegramMessage && (
              <OutreachBlock label="Telegram" text={analysis.firstOutreach.telegramMessage} />
            )}
          </div>
        </Section>

        <Section title="Diagnostic Questions">
          <ol className="list-decimal space-y-2 pl-4 text-sm text-foreground">
            {analysis.diagnosticQuestions.map((q, i) => (
              <li key={i} className="leading-relaxed">
                {q}
              </li>
            ))}
          </ol>
        </Section>

        <div className="rounded-2xl border border-accent/30 bg-accent-soft p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Next Best Action
          </h3>
          <NextActionBadge action={analysis.nextBestAction.action} />
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            {analysis.nextBestAction.reasoning}
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-2">{label}</div>
    </div>
  );
}

function OutreachBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-2">{label}</span>
        <CopyButton text={text} />
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{text}</p>
    </div>
  );
}
