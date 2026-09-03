// "unknown" means the field was not present in the Apify response — never guessed.

export interface NormalizedProfile {
  username: string;
  fullName: string | "unknown";
  biography: string | "unknown";
  businessCategoryName: string | "unknown";
  followersCount: number | null;
  followsCount: number | null;
  postsCount: number | null;
  isBusinessAccount: boolean | "unknown";
  verified: boolean | "unknown";
  externalUrls: string[];
  profilePicUrl: string | "unknown";
}

export interface NormalizedReel {
  shortcode: string | "unknown";
  url: string | "unknown";
  caption: string | "unknown";
  timestamp: string | "unknown";
  videoDuration: number | null;
  videoPlayCount: number | null;
  likesCount: number | null;
  commentsCount: number | null;
  displayUrl: string | "unknown";
  ownerUsername: string | "unknown";
}

export interface ContentStats {
  reelsAnalyzed: number;
  reelsWithViewData: number;
  min: number | null;
  max: number | null;
  median: number | null;
  average: number | null;
  topReels: NormalizedReel[];
  bottomReels: NormalizedReel[];
}

export interface NormalizedLead {
  profile: NormalizedProfile;
  reels: NormalizedReel[];
  contentStats: ContentStats;
  collectedAt: string;
}
