import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** One QueryClient per mounted React island (each Astro builder page mounts
 * its own root island via `client:load`), created once via useState so it
 * survives re-renders without leaking state across islands/page loads. All
 * server state in the builder (sections, entries, template preferences,
 * subscription, render data) flows through TanStack Query so the shared
 * <SaveStatus/> indicator can read mutation status directly instead of any
 * bespoke loading-state plumbing. */
export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 1 },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
