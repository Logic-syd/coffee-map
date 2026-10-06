"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { parseVenues } from "@/utils/venue-data";
import type { Venue } from "@/types/venue";
export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    setLoading(true);
    setError(false);
    const timeout = setTimeout(() => {
      if (live) {
        setError(true);
        setLoading(false);
      }
      controller.abort();
    }, 15_000);
    void (async () => {
      try {
        const result = await supabase
          .from("venues")
          .select("*")
          .order("created_at", { ascending: false })
          .abortSignal(controller.signal);
        if (result.error) throw result.error;
        const next = parseVenues(result.data);
        if (live && !controller.signal.aborted) setVenues(next);
      } catch {
        if (live) setError(true);
      } finally {
        clearTimeout(timeout);
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  return { venues, loading, error, retry };
}
