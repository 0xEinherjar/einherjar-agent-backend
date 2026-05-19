import { constants } from "../shared/constant.js";
import { Client, OAuth1 } from '@xdevplatform/xdk';

export default class XClient {
  // static sinceId = null;
  static sinceId = "2053699584745222418";

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
        text: content
      })
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

  async sendDmByUsername(userId, text) {
    await this.client.directMessages.createByParticipantId(userId, { body: { text: text } });
  }
}