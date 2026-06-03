import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoDatabase } from "../database/mongodb.js";
import { SaveUserFactory } from "../factories/user/save.js";
import { constants } from "../shared/constant.js";

export const auth = betterAuth({
  database: mongodbAdapter(
    MongoDatabase.client.db(constants.MONGODB_NAME_DATABASE),
    {
      client: MongoDatabase.client,
    },
  ),
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: true,
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  secret: constants.BETTER_AUTH_SECRET,
  baseURL: constants.BETTER_AUTH_URL,
  socialProviders: {
    twitter: {
      clientId: constants.TWITTER_CLIENT_ID,
      clientSecret: constants.TWITTER_CLIENT_SECRET,
    },
    google: {
      prompt: "select_account",
      clientId: constants.GOOGLE_CLIENT_ID,
      clientSecret: constants.GOOGLE_CLIENT_SECRET,
    },
  },
  trustedOrigins: [constants.FRONTEND_URL],
  databaseHooks: {
    account: {
      create: {
        after: async (account, context) => {
          const user = await context.context.internalAdapter.findUserById(
            account.userId,
          );

          let providerEmail = "";
          if (account.providerId === "google" && account.accessToken) {
            try {
              const res = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                  headers: { Authorization: `Bearer ${account.accessToken}` },
                },
              );
              const profile = await res.json();
              providerEmail = profile.email;
            } catch (e) {
              console.error("Failed to fetch google profile", e);
            }
          }

          const email = providerEmail || user?.email;
          const { UserRepository } = await import("../repositories/user.js");
          const repo = new UserRepository(new MongoDatabase());

          let existingUser = await repo.loadOne({ userId: account.userId });
          if (!existingUser && email) {
            existingUser = await repo.loadOne({ gmailAddress: email });
          }

          if (existingUser) {
            let updated = false;
            if (!existingUser.userId) {
              existingUser.userId = account.userId;
              updated = true;
            }
            if (account.providerId === "google" && !existingUser.gmailAddress) {
              existingUser.gmailAddress = email;
              updated = true;
            }
            if (account.providerId === "twitter" && !existingUser.twitterId) {
              existingUser.twitterId = account.accountId;
              updated = true;
            }
            if (updated) {
              // Update using walletId to be safe, since userId could have been null previously
              const db = new Database();
              await db.update(
                "user_agent",
                { walletId: existingUser.walletId },
                {
                  userId: existingUser.userId,
                  twitterId: existingUser.twitterId,
                  gmailAddress: existingUser.gmailAddress,
                },
              );
            }
            return;
          }

          await SaveUserFactory().execute({
            userId: account.userId,
            accountId: account.accountId,
            providerId: account.providerId,
            email,
          });
        },
      },
      delete: {
        after: async (account, _) => {
          const { UserRepository } = await import("../repositories/user.js");
          const repo = new UserRepository(new MongoDatabase());

          const existingUser = await repo.loadOne({ userId: account.userId });
          if (existingUser) {
            let updated = false;
            if (account.providerId === "google" && existingUser.gmailAddress) {
              existingUser.gmailAddress = null;
              updated = true;
            }
            if (account.providerId === "twitter" && existingUser.twitterId) {
              existingUser.twitterId = null;
              updated = true;
            }
            if (updated) {
              await db.update(
                "user_agent",
                { walletId: existingUser.walletId },
                {
                  userId: existingUser.userId,
                  twitterId: existingUser.twitterId,
                  gmailAddress: existingUser.gmailAddress,
                },
              );
            }
          }
        },
      },
    },
  },
});
