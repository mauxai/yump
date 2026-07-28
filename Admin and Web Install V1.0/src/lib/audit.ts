import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AdminAction =
  | "CREDITS_ADJUST"
  | "USER_SUSPEND"
  | "USER_UNSUSPEND"
  | "USER_DELETE"
  | "ROLE_PROMOTE"
  | "ROLE_DEMOTE"
  | "PROJECT_DELETE"
  | "SETTINGS_UPDATE"
  | "MODEL_CREATE"
  | "MODEL_UPDATE"
  | "MODEL_DELETE"
  | "PLAN_CREATE"
  | "PLAN_UPDATE"
  | "PLAN_DELETE"
  | "GATEWAY_CREATE"
  | "GATEWAY_UPDATE"
  | "GATEWAY_DELETE"
  | "LANGUAGE_CREATE"
  | "LANGUAGE_UPDATE"
  | "LANGUAGE_DELETE"
  | "TEMPLATE_CREATE"
  | "TEMPLATE_UPDATE"
  | "TEMPLATE_DELETE";

export type AuditTargetType = "user" | "project" | "model" | "plan" | "gateway" | "language" | "template";

/** Append a row to AdminAudit. Call this AFTER a successful admin mutation. */
export async function logAdminAction(
  actorAdminId: string,
  action: AdminAction,
  opts: {
    targetType?: AuditTargetType;
    targetId?: string;
    ip?: string;
    before?: unknown;
    after?: unknown;
    meta?: unknown;
  } = {},
): Promise<void> {
  await prisma.adminAudit.create({
    data: {
      actorAdminId,
      action,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId ?? null,
      ip: opts.ip ?? null,
      before: opts.before === undefined ? Prisma.JsonNull : (opts.before as Prisma.InputJsonValue),
      after: opts.after === undefined ? Prisma.JsonNull : (opts.after as Prisma.InputJsonValue),
      meta: opts.meta === undefined ? Prisma.JsonNull : (opts.meta as Prisma.InputJsonValue),
    },
  });
}

export function parseAuditMeta<T = unknown>(meta: Prisma.JsonValue | null): T | null {
  return meta == null ? null : (meta as T);
}
