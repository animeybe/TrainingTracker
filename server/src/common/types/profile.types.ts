import { Gender } from "@prisma/client";
import { Lifestyle, Goal } from "./enums.types";

export interface ProfileDto {
  age: number;
  gender: Gender;
  weight: number;
  height: number;
  lifestyle?: Lifestyle;
  goal?: Goal;
}
