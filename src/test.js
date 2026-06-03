import 'dotenv/config';
import { Agent } from './libraries/agent.js';
import { MongoDatabase } from "./database/mongodb.js";
import { CreateErc20Factory } from "./factories/blockchain/create-erc20.js";
import { TransferStablecoinToUsernameTwitterFactory} from "./factories/transfers/stablecoin-to-username-twitter.js";
import { TransferStablecoinFactory } from "./factories/transfers/stablecoin.js";
import { TransferErc20ToUsernameTwitterFactory } from "./factories/transfers/erc20-to-username-twitter.js";
import { TransferErc20Factory } from "./factories/transfers/erc20.js";
import { WithdrawFactory } from "./factories/user/withdraw.js";
import { CrosschainTransferFactory } from "./factories/blockchain/crosschain-transfer.js";
import { SwapFactory } from "./factories/blockchain/swap.js";
import { TransferStablecoinToGmailFactory } from "./factories/transfers/stablecoin-to-gmail.js";
import { TransferErc20ToGmailFactory } from "./factories/transfers/erc20-to-gmail.js";

const database = new MongoDatabase();
await database.connect();

try {
  const agent = new Agent();
  const result = await agent.run("69d85122f12c4b87209988cf", "Send 0.1 usdc to my father", "web");
  
  // const result = await CreateErc20Factory().execute({
  //   id: "69d85122f12c4b87209988cf",
  //   name: "Einherjar",
  //   symbol: "ENJ",
  //   supply: 1000000,
  // });

  // const result = await TransferStablecoinFactory().execute({
  //   id: "69d85122f12c4b87209988cf",
  //   value: "1",
  //   to: "0x3c50ac574F85Ae158e76fc478249Aea49c45622a",
  //   chain: "arc",
  //   token: "USDC"
  // })

  // const result = await TransferStablecoinToUsernameTwitterFactory().execute({
  //   id: "69d85122f12c4b87209988cf",
  //   value: "0.1",
  //   to: "@0xRodrigo",
  //   token: "USDC",
  //   channel: "twitter"
  // })


  // const result = await TransferErc20Factory().execute({
  //   id: "69d85122f12c4b87209988cf",
  //   value: "10",
  //   to: "0x3c50ac574F85Ae158e76fc478249Aea49c45622a",
  //   token: "0xB6202ef4034DF62725B68d68a5C9fa8808cE9e12"
  // })

  // const result = await TransferErc20ToUsernameTwitterFactory().execute({
  //   id: "69d85122f12c4b87209988cf",
  //   value: "10",
  //   to: "@EinherjarAgent",
  //   token: "0xB6202ef4034DF62725B68d68a5C9fa8808cE9e12"
  // })

  // const result = await WithdrawFactory().execute({
  //   id: "69b9e52e1e9b4095f1cebabc",
  //   value: "4.7",
  //   to: "0x3c50ac574F85Ae158e76fc478249Aea49c45622a",
  // })

  // const result = await CrosschainTransferFactory().execute({
  //   id: "69d85122f12c4b87209988cf",
  //   value: "0.1",
  //   fromChain: "arc",
  //   toChain: "eth"
  // })

  // const result = await SwapFactory().execute({
  //   id: "69d85122f12c4b87209988cf",
  //   value: "0.1",
  //   tokenIn: "USDC",
  //   tokenOut: "EURC"
  // })

  // const result = await TransferStablecoinToGmailFactory().execute({
  //   id: "69d85122f12c4b87209988cf",
  //   value: "0.1",
  //   token: "USDC",
  //   to: "einherjar893@gmail.com"
  // })

  // @EinherjarAgent send 1 usdc to @rackermoonn
  console.log(result);
} catch (e) {
  console.log(e);
} finally {
  await database.close();
}

