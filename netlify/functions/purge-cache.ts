import { purgeCache } from "@netlify/functions";
import type { Handler } from "@netlify/functions";

const handler: Handler = async (event) => {
  // Protect with CRON_SECRET
  const secret = event.headers["x-cron-secret"] || event.queryStringParameters?.secret;
  if (secret !== process.env.CRON_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    await purgeCache();
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Durable Cache purged" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: String(error) }),
    };
  }
};

export { handler };
