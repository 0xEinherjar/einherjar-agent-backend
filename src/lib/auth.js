import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { constants } from "../shared/constant.js";
import { SaveUserFactory } from "../factory/user/save.js";
import Database from "../database/client.js";

export const auth = betterAuth({
  database: mongodbAdapter(Database.client.db(constants.MONGODB_NAME_DATABASE), {
    client: Database.client,
  }),
  // account: {
  //   skipStateCookieCheck: true,
  // },
  advanced: {
    database: {
      generateId: "uuid",
    },
    // crossSubDomainCookies: {
    //   domain: ".einherjar.online",
    // },
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: true,
        }
      }
    }
  },
  session: {
    // expiresIn: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    }
  },
  secret: constants.BETTER_AUTH_SECRET,
  baseURL: constants.BETTER_AUTH_URL,
  // basePath: "/auth",
  socialProviders: {
    twitter: {
      clientId: constants.TWITTER_CLIENT_ID,
      clientSecret: constants.TWITTER_CLIENT_SECRET,
    }
  },
  trustedOrigins: [constants.FRONTEND_URL],
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