import { Prisma } from "@prisma/client";

export function repsToJsonArray(
  reps: Prisma.JsonValue | null,
): [number, number] {
  if (!reps || typeof reps !== "object" || !Array.isArray(reps)) {
    return [6, 12];
  }
  const [min, max] = reps;
  if (typeof min === "number" && typeof max === "number") {
    return [min, max];
  }
  return [6, 12];
}
