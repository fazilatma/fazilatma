"use client";

import { useEffect } from "react";
import { normalizeLiveContent } from "@/lib/live-content";
import { setCachedLiveContent } from "@/hooks/useLiveContent";

export default function LiveContentBootstrap() {
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/live-content?bootstrap=${Date.now()}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        setCachedLiveContent(normalizeLiveContent(data));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
