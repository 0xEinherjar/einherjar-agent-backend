import { MongoClient } from "mongodb";
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { z } from "zod";
import { createERC20Token } from "../tools/create-erc20.js";
import { transferERC20Token } from "../tools/transfer-erc20.js";
import { transferERC20TokenToUsername } from "../tools/transfer-erc20-to-username-twitter.js";
import { transferNative } from "../tools/transfer-native.js";
import { transferNativeToUsername } from "../tools/transfer-native-to-username-twitter.js";
import { crosschainTransfer } from "../tools/crosschain-transfer.js";
import { constants } from "../shared/constant.js";

const client = new MongoClient(constants.MONGODB_URI);

export class Agent {
  constructor({ systemPrompt }) {
    this.model = new ChatOpenAI({ 
      temperature: 1, 
      apiKey: constants.LLM_API_KEY,
      model: constants.LLM_MODEL,
    });

    const checkpointer = new MongoDBSaver({ 
      client,
      dbName: constants.MONGODB_NAME_DATABASE, 
      checkpointCollectionName: "checkpoint", 
      checkpointWritesCollectionName: "checkpoint_writes"
    });
    const contextSchema = z.object({ twitterAuthorId: z.string() });

    this.agent = createAgent({
      model: this.model,
      tools: this.initializeTools(),
      systemPrompt: systemPrompt,
      // checkpointer: checkpointer,
      contextSchema: contextSchema
    });
  }

  initializeTools() {
    const toolsRegistry = [ 
      createERC20Token,
      transferERC20Token,
      transferERC20TokenToUsername,
      transferNative,
      transferNativeToUsername,
      crosschainTransfer
    ];
    return toolsRegistry.map(item => tool(item.handle, {
      name: item.name,
      description: item.description,
      schema: item.parameters,
    }));
  }


  async run(id, content) {      
    const result = await this.agent.invoke(
      { messages: [{ role: "user", content }] },
      { 
        // configurable: { thread_id: id },
        context: { twitterAuthorId: id }
      },
    );
    return result.messages.at(-1).content;
  }
}
