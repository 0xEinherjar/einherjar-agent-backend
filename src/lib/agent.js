import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MongoClient } from "mongodb";
import { createAgent, tool, providerStrategy } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { success, z } from "zod";
import { createERC20Token } from "../tools/create-erc20.js";
import { transferERC20Token } from "../tools/transfer-erc20.js";
import { transferERC20TokenToUsername } from "../tools/transfer-erc20-to-username-twitter.js";
import { transferUsdc } from "../tools/transfer-usdc.js";
import { transferUsdcToUsername } from "../tools/transfer-usdc-to-username-twitter.js";
import { crosschainTransfer } from "../tools/crosschain-transfer.js";
import { transferEurc } from "../tools/transfer-eurc.js";
import { transferEurcToUsername } from "../tools/transfer-eurc-to-username-twitter.js";
import { transferUsdcToGmail } from "../tools/transfer-usdc-to-gmail.js";
import { transferEurcToGmail } from "../tools/transfer-eurc-to-gmail.js";
import { transferERC20TokenToGmail } from "../tools/transfer-erc20-to-gmail.js";
import { constants } from "../shared/constant.js";

const client = new MongoClient(constants.MONGODB_URI);
const systemPrompt = readFileSync(join(process.cwd(), "src", "prompts", "agent.txt"), "utf-8");

export class Agent {
  constructor() {
    this.model = new ChatOpenAI({ 
      temperature: 0.2, 
      apiKey: constants.LLM_API_KEY,
      model: constants.LLM_MODEL,
    });

    const checkpointer = new MongoDBSaver({ 
      client,
      dbName: constants.MONGODB_NAME_DATABASE, 
      checkpointCollectionName: "checkpoint", 
      checkpointWritesCollectionName: "checkpoint_writes",
    });

    const contextSchema = z.object({
      authorId: z.string(),
      channel: z.enum(["twitter", "telegram", "web"]).default("twitter"),
    });

    this.agent = createAgent({
      model: this.model,
      tools: this.initializeTools(),
      systemPrompt: systemPrompt,
      // checkpointer: checkpointer,
      contextSchema: contextSchema,
    });
  }

  initializeTools() {
    const toolsRegistry = [ 
      createERC20Token,
      transferERC20Token,
      transferERC20TokenToUsername,
      transferUsdc,
      transferUsdcToUsername,
      crosschainTransfer,
      transferEurc,
      transferEurcToUsername,
      transferUsdcToGmail,
      transferEurcToGmail,
      transferERC20TokenToGmail,
    ];
    return toolsRegistry.map(item => tool(item.handle, {
      name: item.name,
      description: item.description,
      schema: item.parameters,
    }));
  }


  async run(id, content, channel = "twitter") {      
    const result = await this.agent.invoke(
      { messages: [{ role: "user", content }] },
      { 
        // configurable: { thread_id: id },
        context: { authorId: id, channel },
        recursionLimit: 5
      },
    );
    try {
      const msg = result.messages.at(-1).content;
      if (typeof msg === "string") {
        // Find JSON block in case the LLM added extra text
        const match = msg.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch (e) {}
        }
        return JSON.parse(msg);
      }
      return msg;
    } catch (e) {
      // If it's completely unparseable, clean it up or just return the text
      let rawText = result.messages.at(-1).content;
      // Remove any broken JSON-like prefix if we couldn't parse it
      rawText = rawText.replace(/\{.*\}\n?/g, '').trim() || rawText;
      return { content: rawText, success: false, ignored: false };
    }
  }
}
