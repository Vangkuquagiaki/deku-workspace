import { db } from "@/lib/db";

export type AuditAction =
  | "RECORDING_CONSENT_REQUESTED"
  | "RECORDING_CONSENT_GIVEN"
  | "RECORDING_CONSENT_DECLINED"
  | "RECORDING_START"
  | "RECORDING_STOP"
  | "TASK_CREATED_FROM_AI"
  | "HR_IMPORT_ATTENDANCE"
  | "HR_IMPORT_EMPLOYEES"
  | "PROFILE_VIEW";

interface LogAuditParams {
  actorId: string;
  action: AuditAction | string;
  targetType: string;
  targetId: string;
  detail?: Record<string, any>;
  ipAddress?: string;
}

export async function logAudit({
  actorId,
  action,
  targetType,
  targetId,
  detail,
  ipAddress,
}: LogAuditParams) {
  try {
    return await db.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        detail: (detail || ipAddress) ? { ...(detail || {}), ...(ipAddress ? { ipAddress } : {}) } : undefined,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
    // Audit logging should not crash the main business transaction unless strictly required
    return null;
  }
}
