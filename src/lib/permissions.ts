import { Role } from "@prisma/client";
import type { SessionUser } from "./auth";

export const permissions = {
  floorView: [Role.CASHIER, Role.SERVER, Role.MANAGER] as Role[],
  floorEditLayout: [Role.MANAGER] as Role[],
  order: [Role.CASHIER, Role.SERVER, Role.MANAGER] as Role[],
  discount: [Role.MANAGER] as Role[],
  void: [Role.MANAGER, Role.CASHIER] as Role[],
  kds: [Role.KITCHEN, Role.MANAGER] as Role[],
  menuAdmin: [Role.MANAGER] as Role[],
  staffAdmin: [Role.MANAGER] as Role[],
  reports: [Role.MANAGER, Role.CASHIER] as Role[],
  settings: [Role.MANAGER] as Role[],
};

export type Permission = keyof typeof permissions;

export function can(user: Pick<SessionUser, "role"> | null | undefined, perm: Permission) {
  if (!user) return false;
  return permissions[perm].includes(user.role);
}

export function assertCan(user: SessionUser, perm: Permission) {
  if (!can(user, perm)) {
    const err = new Error("权限不足");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export const roleLabel: Record<Role, string> = {
  CASHIER: "收银",
  SERVER: "服务员",
  KITCHEN: "后厨",
  MANAGER: "店长",
};
