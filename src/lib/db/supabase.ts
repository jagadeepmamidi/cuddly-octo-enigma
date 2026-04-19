import { ApiException } from "@/lib/utils/errors";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function assertSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new ApiException(
      500,
      "supabase_env_missing",
      "Supabase environment variables are not fully configured."
    );
  }
}

export function getSupabaseRestUrl(path: string) {
  assertSupabaseEnv();
  return `${SUPABASE_URL}/rest/v1/${path.replace(/^\/+/, "")}`;
}

export function getSupabaseServiceHeaders() {
  assertSupabaseEnv();
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY as string,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY as string}`,
    "Content-Type": "application/json"
  };
}

