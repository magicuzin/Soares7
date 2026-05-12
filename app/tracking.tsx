"use client";

import { useEffect, type MouseEvent } from "react";

const telegramUrl = "https://t.me/trampo7fxp";

type TrackingEvent = "visit" | "click";

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

function sendTrackingEvent(event: TrackingEvent) {
  const payload = JSON.stringify({
    event,
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer,
    params: getParams(),
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
