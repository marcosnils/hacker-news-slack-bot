// @ts-ignore - no type info for this module
import regexEscape from "escape-string-regexp";
import { TeamAndKeywords } from "@/lib/upstash";

export function combineText(post: any) {
  /* combine text from post's title, text, and url */
  let text = "";
  if (post.url) {
    text += `${post.url}\n`;
  }
  if (post.title) {
    text += `${post.title}\n`;
  }
  if (post.text) {
    text += `${post.text}\n`;
  }
  return text;
}

export function postScanner(teamsAndKeywords: TeamAndKeywords) {
  const keywordMapping = new Map() as Map<string, string[]>;
  const keywords = new Set();

  for (const teamId of Object.keys(teamsAndKeywords)) {
    for (const keyword of teamsAndKeywords[teamId]) {
      keywords.add(keyword);

      let teams = keywordMapping.get(keyword);
      if (teams === undefined) {
        teams = [];
        keywordMapping.set(keyword, teams);
      }
      teams.push(teamId);
    }
  }


  const keywordArray = Array.from(keywords) as string[];
  const boundaries = keywordArray.map(
    (keyword) => `\\b${regexEscape(keyword)}\\b`
  );

  const scanner = new RegExp(`(${boundaries.join(")|(")})`, "gi"); // create a regex that matches all keywords

  return (post: any): Set<string> => {
    const text = combineText(post); // combine text from post's title, text, and url
    const teamsInterestedInThisPost = new Set() as Set<string>; // set of team IDs that are interested in this post

    text.replace(scanner, (_, ...terms) => {
      for (let i = 0; i < keywordArray.length; i++) {
        if (terms[i] !== undefined) {
          // if the keyword is found in the text
          const teamsSubscribedToThisKeyword = keywordMapping.get(
            keywordArray[i]
          );
          teamsSubscribedToThisKeyword!.forEach((teamId) => {
            // using ! here because we know teamsSubscribedToThisKeyword is always defined
            teamsInterestedInThisPost.add(teamId); // add team ID to set of teams that are interested in this post (if not already in set)
          });
          break;
        }
      }
      return ""; // replace all instances of keywords with empty string (just for the replace function, we're not actually interested in the text here)
    });

    return teamsInterestedInThisPost; // return set of team IDs that are interested in this post
  };
}

export function truncateString(str: string, num: number) {
  if (!str) return "";
  if (str.length > num) {
    return str.slice(0, num) + "...";
  } else {
    return str;
  }
}


export const equalsIgnoreOrder = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.sort().join(",") === b.sort().join(",");
};
