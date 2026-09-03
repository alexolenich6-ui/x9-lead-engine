import type { ContentStats, NormalizedProfile, NormalizedReel } from "./normalize/types";
import type { LeadAnalysis } from "./sales-brain/types";

export interface LeadRecord {
  id: string;
  username: string;
  analyzedAt: string;
  // When the underlying Apify data was fetched, and whether this analysis
  // reused a cached copy or triggered a live Apify call.
  instagramFetchedAt: string;
  instagramSource: "cache" | "live" | "mock";
  profile: NormalizedProfile;
  reels: NormalizedReel[];
  contentStats: ContentStats;
  analysis: LeadAnalysis;
}

export interface LeadHistoryEntry {
  id: string;
  username: string;
  fullName: string | "unknown";
  icpScore: number;
  verdict: LeadAnalysis["icp"]["verdict"];
  offer: LeadAnalysis["recommendedOffer"]["offer"];
  analyzedAt: string;
}

export function toHistoryEntry(record: LeadRecord): LeadHistoryEntry {
  return {
    id: record.id,
    username: record.username,
    fullName: record.profile.fullName,
    icpScore: record.analysis.icp.totalScore,
    verdict: record.analysis.icp.verdict,
    offer: record.analysis.recommendedOffer.offer,
    analyzedAt: record.analyzedAt,
  };
}
