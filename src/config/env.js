import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.any().transform(Number).default(3000),
  MONGODB_URI: z.string().url("MONGODB_URI must be a valid URL"),
  MONGODB_NAME_DATABASE: z.string().min(1, "MONGODB_NAME_DATABASE is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  TWITTER_CLIENT_ID: z.string().min(1, "TWITTER_CLIENT_ID is required"),
  TWITTER_CLIENT_SECRET: z.string().min(1, "TWITTER_CLIENT_SECRET is required"),
  TWITTER_CONSUMER_KEY: z.string().min(1, "TWITTER_CONSUMER_KEY is required"),
  TWITTER_CONSUMER_SECRET: z.string().min(1, "TWITTER_CONSUMER_SECRET is required"),
  TWITTER_ACCESS_TOKEN: z.string().min(1, "TWITTER_ACCESS_TOKEN is required"),
  TWITTER_ACCESS_SECRET: z.string().min(1, "TWITTER_ACCESS_SECRET is required"),
  LLM_API_KEY: z.string().min(1, "LLM_API_KEY is required"),
  LLM_MODEL: z.string().min(1, "LLM_MODEL is required"),
  CIRCLE_KIT_KEY: z.string().min(1, "CIRCLE_KIT_KEY is required"),
  CIRCLE_API_KEY: z.string().min(1, "CIRCLE_API_KEY is required"),
  CIRCLE_ENTITY_SECRET: z.string().min(1, "CIRCLE_ENTITY_SECRET is required"),
  CIRCLE_WALLET_SET_ID: z.string().min(1, "CIRCLE_WALLET_SET_ID is required"),
  PRIVY_APP_ID: z.string().min(1, "PRIVY_APP_ID is required"),
  PRIVY_APP_SECRET: z.string().min(1, "PRIVY_APP_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
});

export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => `${err.path.join(".")}: ${err.message}`).join("\n");
      console.error("❌ CRITICAL: Missing Environment Variables:\n" + missingVars);
      throw new Error(`Invalid environment variables:\n${missingVars}`);
    }
    throw error;
  }
}

