import { purgeCache } from "@netlify/functions";
import type { Handler } from "@netlify/functions";
import { timingSafeEqual } from "crypto";

function getProvidedSecret(event: Parameters<Handler>[0]): string {
  const authorization = event.headers.authorization ?? event.headers.Authorization;
  const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i);

  return bearerMatch?.[1] ?? event.headers["x-cron-secret"] ?? "";
}

function secretsMatch(provided: string, expected: string | undefined): boolean {
  if (!provided || !expected) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const handler: Handler = async (event) => {
  const secret = getProvidedSecret(event);
  if (!secretsMatch(secret, process.env.CRON_SECRET)) {
    return {
      statusCode: 401,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    await purgeCache();
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ success: true, message: "Durable Cache purged" }),
    };
  } catch (error) {
    console.error("Durable Cache purge failed:", error);

    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ success: false, error: "Durable Cache purge failed" }),
    };
  }
};

export { handler };
