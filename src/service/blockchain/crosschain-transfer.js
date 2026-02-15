import { ArcTestnet, EthereumSepolia, BaseSepolia, OptimismSepolia, AvalancheFuji, PolygonAmoy, ArbitrumSepolia } from "@circle-fin/bridge-kit/chains";
import { createWalletClient, createPublicClient, http } from "viem";
import { createViemAccount } from "@privy-io/node/viem";
import { ViemAdapter } from "@circle-fin/adapter-viem-v2";
import { BridgeKit } from "@circle-fin/bridge-kit";
import { left, right } from "../../shared/either.js";
import { resolveChain } from "../../shared/resolve-chain.js";

export default class Service {
  constructor({ repository, walletProvider }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
  }

  async execute(input) {
    const user = await this.repository.loadOne({ twitterId: input.id });
    if (!user) return left({ type: "NOT_FOUND", message: "User not found" });

    const fromChain = resolveChain(input.fromChain);
    const toChain = resolveChain(input.toChain);

    if (!fromChain || !toChain) {
      return left({ type: "INVALID_CHAIN", message: "Unsupported or unknown blockchain network" })
    }

    const account = await createViemAccount(this.walletProvider.getClient(), {
      walletId: user.walletId,
      address: user.address
    });
    
    const supportedChains = [ArcTestnet, EthereumSepolia, BaseSepolia, OptimismSepolia, AvalancheFuji, PolygonAmoy, ArbitrumSepolia];

    const fromAdapter = new ViemAdapter({
      getPublicClient: ({ chain }) => createPublicClient({
        chain,
        transport: http(),
      }),
      getWalletClient: ({ chain }) => createWalletClient({
        chain,
        account,
        transport: http(),
      })
    }, 
    {
      addressContext: "user-controlled",
      supportedChains: supportedChains,
    });

    const toAdapter = new ViemAdapter({
      getPublicClient: ({ chain }) => createPublicClient({
        chain,
        transport: http(),
      }),
      getWalletClient: ({ chain }) => createWalletClient({
        chain,
        transport: http(),
        account,
      }),
    },
    {
      addressContext: "user-controlled",
      supportedChains: supportedChains,
    });

    const kit = new BridgeKit()
    console.log("BridgeKit initialized");
    const result = await kit.bridge({
      from: { adapter: fromAdapter, chain: fromChain },
      to: { adapter: toAdapter, chain: toChain },
      amount: input.value,
    })

    if (result.state === "success") {
      return right(`Bridge completed successfully. ${result.steps.at(-1).explorerUrl}`)
    } else {
      const failedStep = result.steps.find((s) => s.state === "error")
      return left(`Bridge failed: ${failedStep.name}`)
    }
  }

}