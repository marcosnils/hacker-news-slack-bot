import { createClient } from "redis";
import { getLatestPost } from "./hn";

const redis = createClient({ url: process.env.REDIS_LABS_URL });

export { redis as redisClient };


export async function isDuplicateCron() {
  /* Function to check for duplicate cron jobs:
   * nx  tells it to only set the key if it does not exist yet, otherwise an error is returned
   * ex  sets the TTL on the key to 5 seconds
   * This function should return string OK  if the key did not exists and was set correctly
   * or null  if the key already existed
   */
  const response = await redis.set("dedupIndex", "set", { NX: true, EX: 5 });
  return response === null;
}

export async function getAccessToken(teamId: string) {
  // If you are self hosting this app & have set a SLACK_OAUTH_TOKEN env var, you can just return it here.
  if (process.env.SLACK_OAUTH_TOKEN) return process.env.SLACK_OAUTH_TOKEN;

  /* Get the access token for a Slack team in redis */
  return await redis.get(`${teamId}_token`);
}


export async function getKeywords(teamId: string): Promise<string[]> {
  /* Get list of keywords for a given team from redis */

  return JSON.parse(await redis.hGet("keywords", teamId) || '[]');
}

export async function addKeyword(teamId: string, keyword: string) {
  /* Add a keyword for a team in redis */
  const keywords = await getKeywords(teamId); // get list of keywords for team

  if (!keywords.includes(keyword)) {
    // if keyword is not already in list, add it
    keywords.push(keyword);
    await redis.hSet("keywords", teamId, JSON.stringify(keywords));
    return 1; // return 1 to indicate keyword was added (hset returns 0 if key already exists)
  } else {
    // if keyword is already in list
    return 0; // return 0 to indicate keyword already exists and was not added
  }
}

export async function removeKeyword(teamId: string, keyword: string) {
  /* Remove a keyword for a team in redis */
  const keywords = await getKeywords(teamId); // get list of keywords for team

  if (keywords.includes(keyword)) {
    // if keyword is in list, remove it
    keywords.splice(keywords.indexOf(keyword), 1);
    await redis.hSet("keywords", teamId, JSON.stringify(keywords));
    return 1; // return 1 to indicate keyword was removed (hset returns 0 if key already exists)
  } else {
    // if keyword is not in list
    return 0; // return 0 to indicate keyword was not in the list and was not removed
  }
}

export async function countKeywords(teamId: string) {
  /* Count the list of keywords from redis */
  return (await getKeywords(teamId)).length;
}

export async function getChannel(teamId: string) {
  /* Get the channel ID to send notifications in for a Slack team in redis */
  return await redis.get(`${teamId}_channel`);
}

export async function setChannel(teamId: string, channel: string) {
  /* Set the channel ID to send notifications in for a Slack team in redis */
  return await redis.set(`${teamId}_channel`, channel);
}

export async function getLastCheckedId(): Promise<number> {
  /* Get the last checked post ID from redis */
  const lastCheckedId = (new Number(await redis.get("lastCheckedId"))) as number;
  if (!lastCheckedId) {
    // if lastCheckedId is not set (first time running), return the latest post ID on HN instead
    const latestPostId = await getLatestPost();
    return latestPostId;
  }
  return lastCheckedId;
}

export async function setLastCheckedId(id: number) {
  /* Set the last checked post ID in redis */
  return await redis.set("lastCheckedId", id);
}

export async function checkIfPostWasChecked(id: number) {
  /* Check if a post has been checked in redis – 
     if setting the key for the post returns null, it means it's already been set
     Here, we're setting the keys to expire in 24 hours
  */
  return (
    (await redis.set(`post_${id}`, 'true', { NX: true, EX: 24 * 60 * 60 })) ===
    null
  );
}

export interface TeamAndKeywords {
  [teamId: string]: string[];
}

export async function getTeamsAndKeywords(): Promise<TeamAndKeywords> {
  /* Get all teams and their respective keywords */
  const kw = await redis.hGetAll("keywords") || {};

  const res: TeamAndKeywords = {};
  for (const tid in kw) {
    res[tid] = JSON.parse(kw[tid])
  }

  return res;
}


export async function trackUnfurls(teamId: string) {
  /* Track unfurls for a team */
  return await redis.incr(`${teamId}_unfurls`);
}

export async function trackBotUsage(teamId: string) {
  /* Track unfurls for a team */
  return await redis.incr(`${teamId}_notifications`);
}

export interface TeamConfigAndStats {
  teamId: string;
  keywords: string[];
  channel: string;
  unfurls: number;
  notifications: number;
}

