import { Role } from "../../common/types/enums.types";

const VALID_ROLES = ["USER", "ADMIN"] as const;

export interface UserPrismaDto {
  readonly id: string;
  readonly login: string;
  readonly email: string | null;
  readonly password: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function isUserPrismaDto(obj: unknown): obj is UserPrismaDto {
  const dto = obj as Record<string, unknown>;

  return (
    typeof dto.id === "string" &&
    typeof dto.login === "string" &&
    (typeof dto.email === "string" || dto.email === null) &&
    typeof dto.password === "string" &&
    typeof dto.role === "string" &&
    VALID_ROLES.includes(dto.role as any) &&
    typeof dto.isActive === "boolean" &&
    dto.createdAt instanceof Date &&
    !isNaN(dto.createdAt.getTime()) &&
    dto.updatedAt instanceof Date &&
    !isNaN(dto.updatedAt.getTime())
  );
}
