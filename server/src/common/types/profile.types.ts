import { Lifestyle, Goal } from "./enums.types";

export interface ProfileDto {
  age: number;
  weight: number;
  height: number;
  lifestyle?: Lifestyle;
  goal?: Goal;
}
