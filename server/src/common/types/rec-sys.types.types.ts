export interface SplitRecommendation {
  split: "FULL_BODY" | "UPPER_LOWER" | "PUSH_PULL_LEGS" | "BRO_SPLIT";
  daysPerWeek: number;
  description: string;
  score: number;
}
