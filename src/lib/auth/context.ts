import type { Role } from "@/lib/types/domain";
import { ApiException } from "@/lib/utils/errors";

export interface ActorContext {
  userId: string;
  role: Role;
}

const validRoles: Role[] = ["customer", "partner_investor", "admin"];

export function requireActor(
  request: Request,
  allowedRoles?: Role[]
): ActorContext {
  const userId = request.headers.get("x-user-id");
  const roleHeader = request.headers.get("x-role");

  if (!userId || !roleHeader) {
    throw new ApiException(
      401,
      "auth_required",
      "Missing x-user-id or x-role headers."
    );
  }

  if (!validRoles.includes(roleHeader as Role)) {
    throw new ApiException(403, "invalid_role", "Invalid role in x-role header.");
  }

  const role = roleHeader as Role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    throw new ApiException(
      403,
      "forbidden",
      "You do not have permission for this action."
    );
  }

  return { userId, role };
}

