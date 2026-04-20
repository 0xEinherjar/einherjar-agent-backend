import 'dotenv/config';
import { Agent } from './lib/agent.js';
import Database from "./database/client.js";
import { CreateErc20Factory } from "./factory/blockchain/create-erc20.js";
import { TransferStablecoinToUsernameTwitterFactory} from "./factory/blockchain/transfer-stablecoin-to-username-twitter.js";
import { TransferStablecoinFactory } from "./factory/blockchain/transfer-stablecoin.js";
import { TransferErc20ToUsernameTwitterFactory } from "./factory/blockchain/transfer-erc20-to-username-twitter.js";
import { TransferErc20Factory } from "./factory/blockchain/transfer-erc20.js";
import { WithdrawFactory } from "./factory/user/withdraw.js";
import { CrosschainTransferFactory } from "./factory/blockchain/crosschain-transfer.js";
import { SwapFactory } from "./factory/blockchain/swap.js";

const database = new Database();
await database.connect();

try {
  // const agent = new Agent();
  // const result = await agent.run("69d85122f12c4b87209988cf", "Envie 0.1 eurc para o endereço 0x3c50ac574F85Ae158e76fc478249Aea49c45622a", "twitter");
  
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
  //   value: "1",
  //   to: "@rackermoonn",
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

  const result = await SwapFactory().execute({
    id: "69d85122f12c4b87209988cf",
    value: "0.1",
    tokenIn: "USDC",
    tokenOut: "EURC"
  })

  // @EinherjarAgent send 1 usdc to @rackermoonn
  console.log(result);
} catch (e) {
  console.log(e);
} finally {
  await database.close();
}

