import "dotenv/config";
import { ProcessedDmEventFactory } from "./factories/twitter/processed-dm-event.js";
import { SocialTransferRepositoryFactory } from "./factories/twitter/social-transfer-repository.js";
import { WithdrawSocialTransferByDmFactory } from "./factories/twitter/withdraw-social-transfer-by-dm.js";
import { LoadUserFactory } from "./factories/user/load.js";
import { Agent } from "./libraries/agent.js";
import logger from "./libraries/logger.js";
import TwitterClient from "./libraries/x-client.js";

let agent = null;

try {
  agent = new Agent();
  logger.info("Twitter agent initialized successfully");
} catch (error) {
  logger.error("Failed to initialize Twitter agent", {
    error: error.message,
    stack: error.stack,
  });
}

async function checkMentions() {
  try {
    const twitterClient = new TwitterClient();
    const mentions = await twitterClient.userMentionTimeline();

    if (!mentions || mentions.length === 0) return;
    await Promise.all(
      mentions.map(async (tweet) => {
        try {
          const user = await LoadUserFactory().execute({
            twitterId: tweet.authorId,
          });
          if (user.isLeft()) return;
          const response = await agent.run(
            user.value.userId,
            tweet.text,
            "twitter",
          );
          if (response.ignored) return;
          let responseText = response.content;
          if (responseText.length > 280)
            responseText = responseText.substring(0, 277) + "...";
          await twitterClient.reply(responseText, tweet.id);
        } catch (error) {
          logger.error(`Error processing mention ${tweet.id}`, {
            error: error.message,
            stack: error.stack,
            tweetId: tweet.id,
            authorId: tweet.authorId,
          });
        }
      }),
    );
  } catch (error) {
    logger.error("Error checking mentions", {
      error: error.message,
      stack: error.stack,
    });
  }
}

async function checkDirectMessages() {
  try {
    const twitterClient = new TwitterClient();
    const [botUser, events] = await Promise.all([
      twitterClient.getMe(),
      loadDirectMessageEvents(twitterClient),
    ]);
    if (!events.length) return;
    for (const event of events) {
      try {
        if (!event.text || event.senderId === botUser.id) continue;

        const processedDmEventRepository = ProcessedDmEventFactory();
        if (await processedDmEventRepository.hasProcessed(event.id)) continue;

        const result = await WithdrawSocialTransferByDmFactory().execute({
          senderId: event.senderId,
          text: event.text,
          dmEventId: event.id,
        });

        if (result.isRight() && result.value.ignored) {
          await processedDmEventRepository.markProcessed({
            dmEventId: event.id,
            senderId: event.senderId,
            status: "IGNORED",
          });
          continue;
        }

        if (result.isLeft()) {
          await twitterClient.sendDmByUsername(
            event.senderId,
            `Withdrawal failed: ${result.value.message}`,
          );
          await processedDmEventRepository.markProcessed({
            dmEventId: event.id,
            senderId: event.senderId,
            status: "FAILED",
          });
          continue;
        }

        const lines = result.value.withdrawn.map(
          (item) =>
            `${item.amount} ${item.token} on ${item.chain}. Hash: ${item.hash}`,
        );
        await twitterClient.sendDmByUsername(
          event.senderId,
          `Withdrawal sent to ${result.value.destinationAddress}:\n${lines.join("\n")}`,
        );
        await processedDmEventRepository.markProcessed({
          dmEventId: event.id,
          senderId: event.senderId,
          status: "WITHDRAWN",
        });
      } catch (error) {
        logger.error(`Error processing DM ${event.id}`, {
          error: error.message,
          stack: error.stack,
          dmEventId: event.id,
          senderId: event.senderId,
        });
      }
    }
  } catch (error) {
    logger.error("Error checking direct messages", {
      error: error.message,
      stack: error.stack,
    });
  }
}

async function loadDirectMessageEvents(twitterClient) {
  const socialTransferRepository = SocialTransferRepositoryFactory();
  const pendingTwitterIds =
    await socialTransferRepository.loadPendingTwitterIds();
  const batches = await Promise.all([
    twitterClient.directMessageEvents(),
    ...pendingTwitterIds.map((twitterId) =>
      twitterClient
        .directMessageEventsByParticipantId(twitterId)
        .catch((error) => {
          logger.warn("Failed to load DM events by participant", {
            twitterId,
            error: error.message,
          });
          return [];
        }),
    ),
  ]);

  const byId = new Map();
  for (const event of batches.flat()) {
    byId.set(event.id, event);
  }
  return [...byId.values()].sort((a, b) => {
    const aId = BigInt(a.id);
    const bId = BigInt(b.id);
    return aId < bId ? -1 : aId > bId ? 1 : 0;
  });
}

let loopTimeout = null;
let dmLoopTimeout = null;
let isRunning = false;

async function mentionLoop() {
  if (!isRunning) return;
  try {
    await checkMentions();
  } catch (error) {
    logger.error("Error in mention check loop", {
      error: error.message,
      stack: error.stack,
    });
  } finally {
    if (isRunning) {
      // Run again after 17.5 minutes (1050000 ms)
      loopTimeout = setTimeout(mentionLoop, 1_050_000);
    }
  }
}

async function dmLoop() {
  if (!isRunning) return;
  try {
    await checkDirectMessages();
  } catch (error) {
    logger.error("Error in direct message loop", {
      error: error.message,
      stack: error.stack,
    });
  } finally {
    if (isRunning) {
      dmLoopTimeout = setTimeout(dmLoop, 1_050_000);
    }
  }
}

// The Twitter service starts.
function startTwitterService() {
  if (!agent) {
    logger.warn("Twitter service not started: agent not initialized");
    return null;
  }
  if (isRunning) {
    return stopTwitterService;
  }
  isRunning = true;
  logger.info("Starting Twitter mention monitoring service");
  setTimeout(mentionLoop, 5000); // Wait 5 seconds before the first execution.
  // setTimeout(dmLoop, 10000); // Check DMs more frequently than mentions.
  return stopTwitterService;
}

function stopTwitterService() {
  if (!isRunning) return;
  isRunning = false;
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  if (dmLoopTimeout) {
    // clearTimeout(dmLoopTimeout);
    // dmLoopTimeout = null;
  }
  logger.info("Twitter mention monitoring service stopped");
}

export {
  checkDirectMessages,
  checkMentions,
  startTwitterService,
  stopTwitterService,
};
