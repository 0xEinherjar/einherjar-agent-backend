import { Client, OAuth1 } from "@xdevplatform/xdk";
import { constants } from "../shared/constant.js";

export default class XClient {
  // static sinceId = null;
  static sinceId = "2056797481657135536";

  constructor() {
    const oauth1 = new OAuth1({
      apiKey: constants.TWITTER_CONSUMER_KEY,
      apiSecret: constants.TWITTER_CONSUMER_SECRET,
      accessToken: constants.TWITTER_ACCESS_TOKEN,
      accessTokenSecret: constants.TWITTER_ACCESS_SECRET,
    });
    this.client = new Client({ oauth1: oauth1 });
  }

  async findUserByUsername(username) {
    const userSearch = await this.client.users.getByUsername(username, {
      userFields: ["username", "name", "profile_image_url"],
    });
    return userSearch.data;
  }

  async reply(content, tweetId) {
    try {
      const reply = await this.client.posts.create({
        reply: { in_reply_to_tweet_id: tweetId },
        text: content,
      });
      return reply.data;
    } catch (error) {
      console.error("Error replying to tweet", error);
      throw error;
    }
  }

  async userMentionTimeline(maxResults = 5) {
    const user = await this.client.users.getMe();
    const opts = {
      maxResults: maxResults,
      tweetFields: ["author_id", "created_at"],
      userFields: ["username", "name", "profile_image_url"],
    };
    if (XClient.sinceId) {
      Object.assign(opts, { sinceId: XClient.sinceId });
    }
    const mentions = await this.client.users.getMentions(user.data.id, opts);
    if (!mentions.data?.length) return null;
    XClient.sinceId = mentions.meta?.newestId ?? XClient.sinceId;
    return mentions.data;
  }

  async getMe() {
    const user = await this.client.users.getMe();
    return user.data;
  }

  async directMessageEvents(maxResults = 20) {
    const events = await this.client.directMessages.getEvents({
      maxResults,
      dmEventFields: [
        "id",
        "text",
        "sender_id",
        "created_at",
        "dm_conversation_id",
        "event_type",
      ],
    });
    if (!events.data?.length) return [];

    return [...events.data].sort((a, b) => {
      const aId = BigInt(a.id);
      const bId = BigInt(b.id);
      return aId < bId ? -1 : aId > bId ? 1 : 0;
    });
  }

  async directMessageEventsByParticipantId(participantId, maxResults = 20) {
    const events = await this.client.directMessages.getEventsByParticipantId(
      participantId,
      {
        maxResults,
        dmEventFields: [
          "id",
          "text",
          "sender_id",
          "created_at",
          "dm_conversation_id",
          "event_type",
        ],
      },
    );
    if (!events.data?.length) return [];

    return [...events.data].sort((a, b) => {
      const aId = BigInt(a.id);
      const bId = BigInt(b.id);
      return aId < bId ? -1 : aId > bId ? 1 : 0;
    });
  }

  async sendDmByUsername(userId, text) {
    await this.client.directMessages.createByParticipantId(userId, {
      body: { text: text },
    });
  }
}
