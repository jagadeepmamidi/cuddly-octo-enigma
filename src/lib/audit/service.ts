import { store } from "@/lib/data/store";
import type { Role } from "@/lib/types/domain";
import { newId } from "@/lib/utils/ids";

export function recordAudit(params: {
  actorId: string;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}) {
  store.auditEvents.push({
    id: newId("audit"),
    actor_id: params.actorId,
    actor_role: params.actorRole,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    metadata: params.metadata,
    created_at: new Date().toISOString()
  });
}

