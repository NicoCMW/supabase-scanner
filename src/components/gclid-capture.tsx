"use client";

import { useEffect } from "react";

export function GclidCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get("gclid");
    if (!gclid) return;

    document.cookie = `gclid=${encodeURIComponent(gclid)};max-age=7776000;path=/;SameSite=Lax`;
    try {
      localStorage.setItem("gclid", gclid);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return null;
}

export function getStoredGclid(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/gclid=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  try {
    return localStorage.getItem("gclid");
  } catch {
    return null;
  }
}
