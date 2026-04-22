import { prisma, SessionAccessMode } from "@birthub/database";
import type { NextFunction, Request, Response } from "express";

export function breakGlassAuditMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const tenantId = request.context.tenantId;
  const actorId = request.context.impersonatedByUserId;

  if (
    request.context.authType !== "session" ||
    request.context.sessionAccessMode !== SessionAccessMode.BREAK_GLASS ||
    !tenantId ||
    !actorId
  ) {
    next();
    return;
  }
  const auditedActorId = actorId;

  response.on("finish", () => {
    void prisma.auditLog.create({
      data: {
        action: "admin.break_glass.accessed",
        actorId: auditedActorId,
        diff: {
          after: {
            breakGlassGrantId: request.context.breakGlassGrantId,
            breakGlassReason: request.context.breakGlassReason,
            breakGlassTicket: request.context.breakGlassTicket,
            method: request.method,
            path: request.originalUrl,
            requestId: request.context.requestId,
            statusCode: response.statusCode,
            targetUserId: request.context.userId
          },
          before: {}
        },
        entityId:
          request.context.breakGlassGrantId ??
          request.context.sessionId ??
          request.context.organizationId ??
          "break-glass",
        entityType: "break_glass_session",
        tenantId
      }
    }).catch(() => undefined);
  });

  next();
}
