import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { isDuplicateCron, redisClient } from "./lib/upstash";
import { cron } from "./lib/cron";

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);
  if (!redisClient.isReady) {
    await redisClient.connect();
  }
  if (await isDuplicateCron()) {
    // check if this is a duplicate cron job (threshold of 5s)
    return { statusCode: 500, body: JSON.stringify({ message: "Duplicate cron job" }) };
  }
  try {
    const response = await cron();
    console.log("Cron job successful! Response:", response);
    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (err) {
    console.log("Cron job error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err }) };
  }
};
