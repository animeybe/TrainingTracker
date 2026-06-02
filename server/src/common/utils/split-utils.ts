import { TrainingSplit } from "../types/enums.types";

export function isValidSplit(split: string): split is TrainingSplit {
  return ["PPL", "FULL_BODY", "UPPER_LOWER", "BRO_SPLIT", "STRENGTH_FOCUS", "HYPERTROPHY_FOCUS"].includes(split);
}

