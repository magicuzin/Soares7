import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type TrackingEvent = "visit" | "click";

type TrackPayload = {
  event?: TrackingEvent;
  url?: string;
  path?: string;
  referrer?: string;
  params?: Record<string, string>;
  currentParams?: Record<string, string>;
  storedAt?: string;
  updatedAt?: string;
  firstUrl?: string;
  lastUrl?: string;
  usedStoredParams?: boolean;
};

const eventMessages: Record<TrackingEvent, string> = {
  visit: "Teve 1 nova visita",
  click: "Teve 1 novo click no botao",
};

function truncate(value: string, maxLength = 950) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function formatParams(params: Record<string, string>, onlyUtm = false) {
  const entries = Object.entries(params).filter(([key]) => {
    return onlyUtm ? key.toLowerCase().startsWith("utm_") : true;
  });

  if (entries.length === 0) {
    return onlyUtm ? "Sem UTMs" : "Sem parametros";
  }

  return truncate(entries.map(([key, value]) => `${key}: ${value}`).join("\n"));
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "Desconhecido";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-client-ip") ||
    "Desconhecido"
  );
}

function getWebhookUrl(event: TrackingEvent) {
  if (event === "click") {
    return process.env.DISCORD_CLICK_WEBHOOK_URL;
  }

  return process.env.DISCORD_VISIT_WEBHOOK_URL;
}

async function sendDiscordWebhook({
  event,
  payload,
  ip,
  userAgent,
}: {
  event: TrackingEvent;
  payload: TrackPayload;
  ip: string;
  userAgent: string;
}) {
  const webhookUrl = getWebhookUrl(event);

  if (!webhookUrl) {
    throw new Error(`Missing Discord webhook env var for ${event}`);
  }

  const params = payload.params || {};
  const message = eventMessages[event];

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
      allowed_mentions: {
        parse: [],
      },
      embeds: [
        {
          title: message,
          color: event === "click" ? 0x1398ff : 0x2f80ed,
          timestamp: new Date().toISOString(),
          fields: [
            {
              name: "IP",
              value: truncate(ip || "Desconhecido", 250),
              inline: true,
            },
            {
              name: "Rota",
              value: truncate(payload.path || "Desconhecida", 250),
              inline: true,
            },
            {
              name: "UTMs",
              value: formatParams(params, true),
            },
            {
              name: "Todos os parametros",
              value: formatParams(params),
            },
            {
              name: "Origem dos parametros",
              value: payload.usedStoredParams
                ? "LocalStorage"
                : "URL atual",
              inline: true,
            },
            {
              name: "Parametros atuais",
              value: formatParams(payload.currentParams || {}),
            },
            {
              name: "Primeira URL salva",
              value: truncate(payload.firstUrl || "Nao salva"),
            },
            {
              name: "Salvo em",
              value: truncate(payload.storedAt || "Nao salvo", 250),
              inline: true,
            },
            {
              name: "Atualizado em",
              value: truncate(payload.updatedAt || "Nao atualizado", 250),
              inline: true,
            },
            {
              name: "URL",
              value: truncate(payload.url || "Desconhecida"),
            },
            {
              name: "Referrer",
              value: truncate(payload.referrer || "Sem referrer"),
            },
            {
              name: "User Agent",
              value: truncate(userAgent || "Desconhecido"),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with ${response.status}`);
  }
}

export async function POST(request: NextRequest) {
  let payload: TrackPayload;

  try {
    payload = (await request.json()) as TrackPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (payload.event !== "visit" && payload.event !== "click") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await sendDiscordWebhook({
      event: payload.event,
      payload,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
