"use client";

import { useEffect, type MouseEvent } from "react";

const telegramUrl = "https://t.me/trampo7fxp";
const storageKey = "soares7_tracking_params";

type TrackingEvent = "visit" | "click";

type StoredTrackingParams = {
  params: Record<string, string>;
  firstUrl: string;
  lastUrl: string;
  savedAt: string;
  updatedAt: string;
};

declare global {
  interface Window {
    __soares7VisitTracked?: boolean;
  }
}

function getParams() {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

function hasParams(params: Record<string, string>) {
  return Object.keys(params).length > 0;
}

function readStoredParams(): StoredTrackingParams | null {
  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as StoredTrackingParams;
  } catch {
    return null;
  }
}

function getPersistedTrackingData(currentParams: Record<string, string>) {
  const storedParams = readStoredParams();
  const now = new Date().toISOString();

  if (hasParams(currentParams)) {
    const trackingData: StoredTrackingParams = {
      params: currentParams,
      firstUrl: storedParams?.firstUrl || window.location.href,
      lastUrl: window.location.href,
      savedAt: storedParams?.savedAt || now,
      updatedAt: now,
    };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(trackingData));
    } catch {
      return trackingData;
    }

    return trackingData;
  }

  return storedParams;
}

function sendTrackingEvent(event: TrackingEvent) {
  const currentParams = getParams();
  const persistedTrackingData = getPersistedTrackingData(currentParams);
  const params = persistedTrackingData?.params || currentParams;

  const payload = JSON.stringify({
    event,
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer,
    params,
    currentParams,
    storedAt: persistedTrackingData?.savedAt,
    updatedAt: persistedTrackingData?.updatedAt,
    firstUrl: persistedTrackingData?.firstUrl,
    lastUrl: persistedTrackingData?.lastUrl,
    usedStoredParams: !hasParams(currentParams) && hasParams(params),
  });

  const blob = new Blob([payload], { type: "application/json" });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", blob);
    return;
  }

  fetch("/api/track", {
    method: "POST",
    body: payload,
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
  }).catch(() => undefined);
}

export function VisitTracker() {
  useEffect(() => {
    if (window.__soares7VisitTracked) {
      return;
    }

    window.__soares7VisitTracked = true;
    sendTrackingEvent("visit");
  }, []);

  return null;
}

export function TelegramButton() {
  function handleClick(_event: MouseEvent<HTMLAnchorElement>) {
    sendTrackingEvent("click");
  }

  return (
    <a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-telegram"
      onClick={handleClick}
    >
      Acessar o Telegram
    </a>
  );
}
