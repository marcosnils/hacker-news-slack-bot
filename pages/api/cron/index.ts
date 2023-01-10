import type { NextApiRequest, NextApiResponse } from "next";
import { cron } from "@/lib/cron";
import { isDuplicateCron, redisClient } from "@/lib/upstash";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  await redisClient.connect();
  if (await isDuplicateCron()) {
    // check if this is a duplicate cron job (threshold of 5s)
    return res.status(500).json({ message: "Duplicate cron job" });
  }
  try {
    const response = await cron();
    console.log("Cron job successful! Response:", response);
    res.status(200).json(response);
  } catch (err) {
    console.log("Cron job error:", err);
    res.status(500).json({ statusCode: 500, message: err });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
