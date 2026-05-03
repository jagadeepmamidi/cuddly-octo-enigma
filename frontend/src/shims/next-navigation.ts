import { useMemo } from "react";

export function usePathname() {
  return window.location.pathname;
}

export function useSearchParams() {
  const search = window.location.search;
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "book" && parts[1]) {
    return { vehicleId: decodeURIComponent(parts[1]) };
  }
  return {};
}
