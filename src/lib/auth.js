import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { constants } from "../shared/constant.js";
import { MongoClient } from "mongodb";
import { SaveUserFactory } from "../factory/user/save.js";

const client = new MongoClient(constants.MONGODB_URI);

export const auth = betterAuth({
  database: mongodbAdapter(client.db(constants.MONGODB_NAME_DATABASE), {
    client: client,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    }
  },
  secret: constants.BETTER_AUTH_SECRET,
  socialProviders: {
    twitter: {
      clientId: constants.TWITTER_CLIENT_ID,
      clientSecret: constants.TWITTER_CLIENT_SECRET,
    }
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account, context) => {
          const user = await context.context.internalAdapter.findUserById(account.userId);
          await SaveUserFactory().execute({
            userId: account.userId,
            accountId: account.accountId,
            email: user.email,
          })
        }
      }
    }
  }
});
