import { Prisma, type AuditAction } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type LogAuditInput = {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
};

/**
 * Writes an audit log entry. Used for critical actions such as product
 * mutations and inventory adjustments. Best-effort: the caller's primary
 * operation must not fail because of a logging failure.
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        userId: input.userId,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
