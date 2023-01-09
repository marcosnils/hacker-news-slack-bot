
export async function sendDiscordMessage(postId: number) {
  console.log(
    `Sending message to ${process.env.DISCORD_CHANNEL_WEBHOOK} for post ${postId}`
  );
  const response = await fetch(`${process.env.DISCORD_CHANNEL_WEBHOOK}`, {
    method: "POST",
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      content: `https://news.ycombinator.com/item?id=${postId}`,
    }),
  });
  return {
    response,
  };
}

