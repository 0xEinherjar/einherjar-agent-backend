import 'dotenv/config';
import { Agent } from './lib/agent.js';
import Database from "./database/client.js";
import { TransferNativeFactory } from "./factory/blockchain/transfer-native.js";
import { CreateErc20Factory } from "./factory/blockchain/create-erc20.js";
import { readFileSync } from "fs";
import { join } from "path";

const database = new Database();
await database.connect();

const systemPrompt = readFileSync(join(process.cwd(), "src", "prompts", "agent.txt"), "utf-8");

try {
  // const agent = new Agent({ systemPrompt });
  // const result = await agent.run("1395762489862901764", "Envie 0.1 usdc para o endereço 0x3c50ac574F85Ae158e76fc478249Aea49c45622a");
  
  const result = await CreateErc20Factory().execute({
    id: "1395762489862901764",
    name: "Einherjar",
    symbol: "ENJ",
    supply: "1000000",
  });


  // const result = await TransferNativeFactory().execute({
  //   id: "1395762489862901764",
  //   to: "0x3c50ac574F85Ae158e76fc478249Aea49c45622a",
  //   value: "1",
  //   chain: "ethereum"
  // });
  console.log(result);
} catch (e) {
  console.log(e);
} finally {
  await database.close();
}

