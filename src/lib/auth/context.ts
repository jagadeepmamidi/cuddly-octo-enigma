import type { Role } from "@/lib/types/domain";
import { auth } from "@/lib/auth/better-auth";
import { getUserOrThrow } from "@/lib/data/repository";
import { ApiException } from "@/lib/utils/errors";

export interface ActorContext {
  userId: string;
  role: Role;
}

const validRoles: Role[] = ["customer", "partner_investor", "admin"];

export async function requireActor(
  request: Request,
  allowedRoles?: Role[]
): Promise<ActorContext> {
  let session:
    | {
        user?: {
          id?: string;
          role?: Role;
        };
      }
    | null
    | undefined;

  try {
    session = (await auth.api.getSession({
      headers: request.headers
    })) as {
      user?: { id?: string; role?: Role };
    } | null;
  } catch {
    session = null;
  }

  let userId: string | null = session?.user?.id ?? null;
  let role: Role | null = null;

  if (userId) {
    try {
      const user = await getUserOrThrow(userId);
      role = user.role;
    } catch {
      role = (session?.user as { role?: Role })?.role ?? null;
    }
  }

  if (!userId || !role) {
    const allowDevHeaders = process.env.ALLOW_DEV_HEADERS === "true";
    if (!allowDevHeaders) {
      throw new ApiException(401, "auth_required", "Authentication is required.");
    }
    userId = request.headers.get("x-user-id");
    const roleHeader = request.headers.get("x-role");
    if (!userId || !roleHeader) {
      throw new ApiException(
        401,
        "auth_required",
        "Missing authenticated session and development headers."
      );
    }
    role = roleHeader as Role;
  }

  if (!validRoles.includes(role)) {
    throw new ApiException(403, "invalid_role", "Invalid role.");
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    throw new ApiException(
      403,
      "forbidden",
      "You do not have permission for this action."
    );
  }

  return { userId, role };
}

// Backward compatibility for any existing sync call sites.
export function requireActorSync() {
  throw new ApiException(
    500,
    "invalid_auth_usage",
    "requireActor is async now. Use await requireActor(...)."
  );
}
