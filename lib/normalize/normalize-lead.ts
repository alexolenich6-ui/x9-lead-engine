import type {
  ContentStats,
  NormalizedLead,
  NormalizedProfile,
  NormalizedReel,
} from "./types";

function str(value: unknown): string | "unknown" {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return "unknown";
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function bool(value: unknown): boolean | "unknown" {
  return typeof value === "boolean" ? value : "unknown";
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export function normalizeProfile(
  raw: Record<string, unknown> | null,
  fallbackUsername: string,
): NormalizedProfile {
  const usernameFromRaw = raw ? str(raw.username) : "unknown";
  return {
    username: usernameFromRaw !== "unknown" ? (usernameFromRaw as string) : fallbackUsername,
    fullName: raw ? str(raw.fullName) : "unknown",
    biography: raw ? str(raw.biography) : "unknown",
    businessCategoryName: raw ? str(raw.businessCategoryName) : "unknown",
    followersCount: raw ? num(raw.followersCount) : null,
    followsCount: raw ? num(raw.followsCount) : null,
    postsCount: raw ? num(raw.postsCount) : null,
    isBusinessAccount: raw ? bool(raw.isBusinessAccount) : "unknown",
    verified: raw ? bool(raw.verified) : "unknown",
    externalUrls: raw ? strArray(raw.externalUrls ?? raw.externalUrl) : [],
    profilePicUrl: raw ? str(raw.profilePicUrl ?? raw.profilePicUrlHD) : "unknown",
  };
}

// Apify's Instagram Scraper actor names view-count fields differently across
// its "details"/"posts" result modes and versions — check every known alias.
function extractViews(item: Record<string, unknown>): number | null {
  return (
    num(item.videoPlayCount) ??
    num(item.videoViewCount) ??
    num(item.playsCount) ??
    num(item.viewCount) ??
    null
  );
}

function extractLikes(item: Record<string, unknown>): number | null {
  return num(item.likesCount) ?? num(item.likes) ?? null;
}

export function normalizeReel(raw: Record<string, unknown>): NormalizedReel {
  return {
    shortcode: str(raw.shortCode ?? raw.shortcode),
    url: str(raw.url),
    caption: str(raw.caption),
    timestamp: str(raw.timestamp),
    videoDuration: num(raw.videoDuration),
    videoPlayCount: extractViews(raw),
    likesCount: extractLikes(raw),
    commentsCount: num(raw.commentsCount),
    displayUrl: str(raw.displayUrl),
    ownerUsername: str(raw.ownerUsername),
  };
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function buildContentStats(reels: NormalizedReel[]): ContentStats {
  const withViews = reels.filter(
    (r): r is NormalizedReel & { videoPlayCount: number } => r.videoPlayCount !== null,
  );
  const viewCounts = withViews.map((r) => r.videoPlayCount);
  const average =
    viewCounts.length > 0
      ? Math.round(viewCounts.reduce((a, b) => a + b, 0) / viewCounts.length)
      : null;
  const sortedByViews = [...withViews].sort((a, b) => b.videoPlayCount - a.videoPlayCount);

  return {
    reelsAnalyzed: reels.length,
    reelsWithViewData: withViews.length,
    min: viewCounts.length ? Math.min(...viewCounts) : null,
    max: viewCounts.length ? Math.max(...viewCounts) : null,
    median: median(viewCounts),
    average,
    topReels: sortedByViews.slice(0, 3),
    bottomReels: sortedByViews.slice(-3).reverse(),
  };
}

/**
 * Apify's "posts" result mode returns every post type (image / carousel / video).
 * A Reel is a video post; we treat any item carrying view-count data as a Reel
 * for MVP purposes, take the most recent `reelsLimit`, and derive stats from those.
 */
export function normalizeLead(
  username: string,
  rawProfile: Record<string, unknown> | null,
  rawPosts: Record<string, unknown>[],
  reelsLimit = 15,
): NormalizedLead {
  const profile = normalizeProfile(rawProfile, username);

  const videoItems = rawPosts.filter((item) => {
    const type = str(item.type);
    if (type === "Video") return true;
    return extractViews(item) !== null;
  });

  const sortedByDate = [...videoItems].sort((a, b) => {
    const ta = str(a.timestamp) !== "unknown" ? new Date(a.timestamp as string).getTime() : 0;
    const tb = str(b.timestamp) !== "unknown" ? new Date(b.timestamp as string).getTime() : 0;
    return tb - ta;
  });

  const reels = sortedByDate.slice(0, reelsLimit).map(normalizeReel);
  const contentStats = buildContentStats(reels);

  return {
    profile,
    reels,
    contentStats,
    collectedAt: new Date().toISOString(),
  };
}
