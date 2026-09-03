export type IcpVerdict = "HIGH_PRIORITY" | "MEDIUM" | "LOW" | "NOT_ICP";
export type RecommendedOfferType = "LAUNCH" | "GROWTH" | "NONE";
export type ContactMethod = "CALL" | "INSTAGRAM_DM" | "TELEGRAM" | "EMAIL" | "UNKNOWN";
export type AuditType = "SHORT_AUDIT" | "DEEP_AUDIT";
export type NextAction =
  | "CALL"
  | "SEND_DM"
  | "SEND_AUDIT"
  | "ASK_QUESTION"
  | "BOOK_CALL"
  | "FOLLOW_UP"
  | "DO_NOT_CONTACT";

export interface IcpScoreItem {
  key: string;
  label: string;
  score: number; // 0-100
  explanation: string;
}

export interface LeadAnalysis {
  leadSummary: string;

  icp: {
    scores: IcpScoreItem[];
    totalScore: number; // 0-100
    verdict: IcpVerdict;
  };

  recommendedOffer: {
    offer: RecommendedOfferType;
    reasoning: string;
  };

  existingStrengths: string[];

  marketingGaps: string[];

  contentAnalysis: {
    strongTopics: string[];
    weakTopics: string[];
    varianceDescription: string;
    organicReachConfirmed: boolean;
    relevanceToCoreServiceHypothesis: string;
  };

  primarySalesAngle: string;

  whatNotToSay: string[];

  bestContactMethod: {
    method: ContactMethod;
    reasoning: string;
  };

  firstOutreach: {
    coldCallOpener: string;
    instagramDm: string;
    telegramMessage: string | null;
  };

  auditRouting: {
    type: AuditType;
    reasoning: string;
    structure: string[];
  };

  diagnosticQuestions: string[];

  nextBestAction: {
    action: NextAction;
    reasoning: string;
  };
}
