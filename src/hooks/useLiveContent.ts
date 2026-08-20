"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_LIVE_CONTENT,
  LIVE_CONTENT_STORAGE_KEY,
  normalizeLiveContent,
  type LiveContent,
} from "@/lib/live-content";

declare global {
  interface Window {
    __OPTIBID_LIVE_CONTENT__?: LiveContent;
  }
}

function readCachedLiveContent() {
  if (typeof window === "undefined") return null;
  if (window.__OPTIBID_LIVE_CONTENT__) return window.__OPTIBID_LIVE_CONTENT__;

  try {
    const raw = window.localStorage.getItem(LIVE_CONTENT_STORAGE_KEY);
    return raw ? normalizeLiveContent(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function storeLiveContent(content: LiveContent) {
  if (typeof window === "undefined") return;
  window.__OPTIBID_LIVE_CONTENT__ = content;
  try {
    window.localStorage.setItem(LIVE_CONTENT_STORAGE_KEY, JSON.stringify(content));
  } catch {
    // localStorage ممکن است در حالت privacy یا محدودیت مرورگر در دسترس نباشد.
  }
}

export function useLiveContent(initialContent: LiveContent = DEFAULT_LIVE_CONTENT) {
  const [content, setContent] = useState<LiveContent>(() => readCachedLiveContent() || initialContent);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/live-content?ts=${Date.now()}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        const normalized = normalizeLiveContent(data);
        storeLiveContent(normalized);
        setContent(normalized);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}

export function getCachedLiveContent() {
  return readCachedLiveContent() || DEFAULT_LIVE_CONTENT;
}

export function setCachedLiveContent(content: LiveContent) {
  storeLiveContent(content);
}
