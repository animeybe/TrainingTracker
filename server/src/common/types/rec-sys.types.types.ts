import { DayType } from "../../domain/common/types/training.types";
import { TrainingSplit } from "./enums.types";

export interface TypedTrainingSplit {
  name: TrainingSplit;
  days: Array<{ type: DayType; frequency: number }>;
}