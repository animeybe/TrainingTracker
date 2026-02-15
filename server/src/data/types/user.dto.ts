import { Role } from "@prisma/client";

export interface UserDto {
  readonly id: string;
  readonly login: string;
  readonly email: string | null;
  readonly password: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function isUserDto(obj: unknown): obj is UserDto {
  const dto = obj as Record<string, unknown>;
  return (
    typeof dto.id === "string" &&
    typeof dto.login === "string" &&
    (typeof dto.email === "string" || dto.email === null) &&
    typeof dto.password === "string" &&
    typeof dto.role === "string" &&
    typeof dto.isActive === "boolean" &&
    dto.createdAt instanceof Date &&
    dto.updatedAt instanceof Date
  );
}
