import { TypedTrainingSplit } from "../../common/types/rec-sys.types.types";
import { DayType } from "./types/training.types";

export function getDayTypeForIndex(
  dayIndex: number,
  split: TypedTrainingSplit,
): DayType {
  const dayMeta = split.days[dayIndex % split.days.length] ?? {
    type: "full" as DayType,
  };
  return dayMeta.type;
}
