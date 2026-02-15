import { MuscleGroup } from "@prisma/client";

export interface MuscleGroupList {
  primary: MuscleGroup;
  secondary: MuscleGroup[];
}
