import "dotenv/config";
import { Agent } from "./lib/agent.js";
import logger from "./lib/logger.js";
import { LoadUserFactory } from "./factory/user/load.js";
import TwitterClient from "./lib/x-client.js";

let agent = null;

try {
  agent = new Agent();
  logger.info('Twitter agent initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Twitter agent', { error: error.message, stack: error.stack });
}

async function checkMentions() {
  try {
    const twitterClient = new TwitterClient();
    const mentions = await twitterClient.userMentionTimeline();
    
    if (!mentions || mentions.length === 0) return;
    await Promise.all(mentions.map(async (tweet) => {
      try {
        // console.log(tweet.id, tweet.text);
        const user = await LoadUserFactory().execute({ twitterId: tweet.authorId });
        if (user.isLeft()) return;
        const response = await agent.run(user.value.userId, tweet.text, "twitter");
        console.log(response);
        
        if (response.ignored) return;
        let responseText = response.content;
        if (responseText.length > 280) responseText = responseText.substring(0, 277) + '...';
        await twitterClient.reply(responseText, tweet.id);
      } catch (error) {
        logger.error(`Error processing mention ${tweet.id}`, {
          error: error.message,
          stack: error.stack,
          tweetId: tweet.id,
          authorId: tweet.authorId
        });
      }
    }));
  } catch (error) {
    logger.error('Error checking mentions', { error: error.message, stack: error.stack });
  }
}

let loopTimeout = null;
let isRunning = false;

async function loop() {
  if (!isRunning) return;
  try {
    await checkMentions();
  } catch (error) {
    logger.error('Error in mention check loop', { error: error.message, stack: error.stack });
  } finally {
    if (isRunning) {
      // Run again after 17.5 minutes (1050000 ms)
      loopTimeout = setTimeout(loop, 1_050_000);
    }
  }
}

// The Twitter service starts.
function startTwitterService() {
  if (!agent) {
    logger.warn('Twitter service not started: agent not initialized');
    return null;
  }
  if (isRunning) {
    return stopTwitterService;
  }
  isRunning = true;
  logger.info('Starting Twitter mention monitoring service');
  setTimeout(loop, 5000); // Wait 5 seconds before the first execution.
  return stopTwitterService;
}

function stopTwitterService() {
  if (!isRunning) return;
  isRunning = false;
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  logger.info('Twitter mention monitoring service stopped');
}

export { checkMentions, startTwitterService, stopTwitterService };