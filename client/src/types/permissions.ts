export const ROUTE_PERMISSIONS = {
  dashboard: ["USER", "ADMIN", "PREMIUM"],
  "exercise-base": ["USER", "ADMIN", "PREMIUM"],
  admin: ["ADMIN"],
  "admin/settings": ["ADMIN"],
  records: ["USER", "ADMIN", "PREMIUM"],
  training: ["USER", "ADMIN", "PREMIUM"],
};

export type RoutePermission = keyof typeof ROUTE_PERMISSIONS;

export function hasPermission(
  userRole: string | null | undefined,
  requiredPermission: string,
): boolean {
  if (!userRole) return false;
  const allowedRoles = ROUTE_PERMISSIONS[requiredPermission as RoutePermission];
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: string | null | undefined): boolean {
  return userRole === "ADMIN";
}

export function isUser(userRole: string | null | undefined): boolean {
  return userRole === "USER" || userRole === "PREMIUM";
}

export function isPremium(userRole: string | null | undefined): boolean {
  return userRole === "PREMIUM";
}

export interface RoleGuardProps {
  requiredPermission: RoutePermission;
  fallbackPath?: string;
}
