import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { left, right } from "../../shared/either.js";
import { constants } from "../../shared/constant.js";
import {
  resolveChainWithDefault,
  resolveChainEurcWithDefault,
  CHAINS_MAP_USDC,
  CHAINS_MAP_EURC,
} from "../../shared/resolve-chain.js";
import User from "../../entity/user.js";
import { abi } from "../../abi/index.js";
import { waitForTxCompletion } from "./helpers.js";
import { recordMetric } from "../../shared/record-metric.js";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

const smartContractPlatformClient = initiateSmartContractPlatformClient({
  apiKey: constants.CIRCLE_API_KEY,
  entitySecret: constants.CIRCLE_ENTITY_SECRET,
});

export default class Service {
  constructor({ repository, walletProvider, xClient }) {
    this.repository = repository;
    this.walletProvider = walletProvider;
    this.xClient = xClient;
  }

  async execute(input) {
    try {
      if (input.channel !== "twitter") return left({ success: false, type: "BAD_REQUEST", message: "Invalid channel" });
      const user = await this.repository.loadOne({ userId: input.id });
      if (!user) return left({ success: false, type: "NOT_FOUND", message: "User not found" });

      const username = input.to.replace("@", "");
      const userX = await this.xClient.findUserByUsername(username);
      if (!userX) return left({ success: false, type: "NOT_FOUND", message: "User not found on X (twitter)" });

      let recipient = await this.repository.loadOne({ twitterId: userX.id });
      if (!recipient) {
        const wallet = await this.walletProvider.createWallet();
        const created = User.create({
          walletId: wallet.id,
          address: wallet.address,
          twitterId: userX.id,
        });
        if (created.isLeft()) return left({ success: false, type: "BAD_REQUEST", message: created.value });
        recipient = created.value;
        await this.repository.create(recipient);
      }

      let resolvedChain;
      let chainsMap;
      if (input.token === "EURC") {
        resolvedChain = resolveChainEurcWithDefault(input.chain);
        chainsMap = CHAINS_MAP_EURC;
      } else if (input.token === "USDC") {
        resolvedChain = resolveChainWithDefault(input.chain);
        chainsMap = CHAINS_MAP_USDC;
      } else {
        return left({ success: false, type: "INVALID_TOKEN", message: "Invalid token" });
      }


      const { decimals, balance } = await this._getTokenBalance(
        resolvedChain,
        user.address
      );
      const amount = Number(Math.round(Number(input.value) * 10 ** decimals));

      if (balance < amount) {
        if (input.token === "USDC") {
          // Acrescenta 0.50 do token ao déficit para cobrir possíveis taxas de bridge (CCTP)
          const bridgeFeeBuffer = Number(Math.round(0.50 * 10 ** decimals));
          const deficit = amount - balance + bridgeFeeBuffer;
          const bridgeResult = await this._tryBridgeFromOtherChains({
            chainsMap,
            targetChain: resolvedChain,
            userAddress: user.address,
            deficit,
            decimals,
            token: input.token,
            userId: input.id,
          });
  
          if (bridgeResult.isLeft()) return bridgeResult;
        } else {
          return left({
            success: false,
            type: "NOT_ENOUGH_BALANCE",
            message: `Insufficient ${input.token} balance in ${resolvedChain.canonical_circle}. Available: ${balance / 10 ** decimals}, Required: ${amount / 10 ** decimals}`,
          });
        }
      }

      const transaction = await client.createTransaction({
        blockchain: resolvedChain.canonical_circle,
        walletAddress: user.address,
        destinationAddress: recipient.address,
        amount: [input.value],
        tokenAddress: resolvedChain.token,
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      const result = await waitForTxCompletion(client, transaction.data?.id);
      if (result.isLeft()) return result;

      await recordMetric({
        type: "TRANSACTION",
        token: input.token,
        amount: Number(input.value),
        chain: resolvedChain.canonical_circle,
        userId: input.id,
      });

      return right({
        success: true,
        data: {
          chain: resolvedChain.canonical_circle,
          hash: result.value,
          value: input.value,
          token: input.token,
          bridged: balance < amount,
        },
      });
    } catch (error) {
      const message = error?.response?.data?.message ?? error?.message ?? String(error);
      return left({ success: false, type: "SERVER_ERROR", message });
    }
  }
  
  /**
   * Consulta decimals e balanceOf de um token em uma rede específica.
   */
  async _getTokenBalance(chain, walletAddress) {
    const [decimalsRes, balanceRes] = await Promise.all([
      smartContractPlatformClient.queryContract({
        address: chain.token,
        blockchain: chain.canonical_circle,
        abiFunctionSignature: "decimals()",
        abiJson: JSON.stringify(abi.ERC20),
      }),
      smartContractPlatformClient.queryContract({
        address: chain.token,
        blockchain: chain.canonical_circle,
        abiFunctionSignature: "balanceOf(address)",
        abiParameters: [walletAddress],
        abiJson: JSON.stringify(abi.ERC20),
      }),
    ]);

    const decimals = Number(decimalsRes.data?.outputValues?.[0] ?? 6);
    const balance = Number(balanceRes.data?.outputValues?.[0] ?? "0");
    return { decimals, balance };
  }

  /**
   * Verifica o saldo em todas as outras redes e faz bridge multi-chain
   * para cobrir o déficit na rede de destino.
   *
   * Exemplo: usuário quer enviar 30 USDC na ARC-TESTNET, mas tem:
   *   - 20 USDC na ARC-TESTNET (balance na rede destino)
   *   - 8 USDC na Base Sepolia
   *   - 7 USDC na Arbitrum Sepolia
   * Déficit = 10 USDC. O sistema faz bridge de 8 da Base e 2 da Arbitrum.
   */
  async _tryBridgeFromOtherChains({
    chainsMap,
    targetChain,
    userAddress,
    deficit,
    decimals,
    token,
    userId,
  }) {
    const otherChains = Object.values(chainsMap).filter(
      (c) => c.canonical_circle !== targetChain.canonical_circle
    );

    // Consulta saldo em todas as outras redes em paralelo
    const balanceChecks = await Promise.all(
      otherChains.map(async (chain) => {
        try {
          const { balance } = await this._getTokenBalance(chain, userAddress);
          return { chain, balance };
        } catch {
          return { chain, balance: 0 };
        }
      })
    );

    // Filtra redes com saldo > 0 e ordena por maior saldo (prioriza esvaziar menos redes)
    const chainsWithBalance = balanceChecks
      .filter((b) => b.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    // Calcula o plano de bridge: quanto pegar de cada rede
    const bridgePlan = [];
    let remaining = deficit;

    for (const entry of chainsWithBalance) {
      if (remaining <= 0) break;

      const take = Math.min(entry.balance, remaining);
      bridgePlan.push({
        chain: entry.chain,
        amountRaw: take,
        amountHuman: String(take / 10 ** decimals),
      });
      remaining -= take;
    }

    // Se ainda falta saldo após verificar todas as redes
    if (remaining > 0) {
      const totalOtherChains = chainsWithBalance.reduce((sum, b) => sum + b.balance, 0);
      return left({
        success: false,
        type: "NOT_ENOUGH_BALANCE",
        message: `Insufficient ${token} balance across all networks. Deficit: ${deficit / 10 ** decimals}, Available on other chains: ${totalOtherChains / 10 ** decimals}`,
      });
    }

    // Executa todos os bridges em paralelo via AppKit (CCTP)
    const bridgeResults = await Promise.all(
      bridgePlan.map(async (plan) => {
        try {
          const result = await appKit.bridge({
            from: {
              adapter,
              chain: plan.chain.canonical_bridge,
              address: userAddress,
            },
            to: {
              adapter,
              chain: targetChain.canonical_bridge,
              address: userAddress,
            },
            amount: plan.amountHuman,
            token,
          });
          return { plan, result, error: null };
        } catch (err) {
          return { plan, result: null, error: err };
        }
      })
    );

    // Verifica se algum bridge falhou
    for (const br of bridgeResults) {
      if (br.error || br.result?.state !== "success") {
        const failedStep = br.result?.steps?.find((s) => s.state === "error");
        return left({
          success: false,
          type: "BRIDGE_FAILED",
          message: `Auto-bridge from ${br.plan.chain.canonical_bridge} to ${targetChain.canonical_bridge} failed (${br.plan.amountHuman} ${token}). Step: ${failedStep?.name ?? "unknown"}`,
        });
      }
    }

    // Registra métricas para cada bridge realizado
    await Promise.all(
      bridgeResults.map((br) =>
        recordMetric({
          type: "BRIDGE",
          token,
          amount: Number(br.plan.amountHuman),
          chain: `${br.plan.chain.canonical_bridge} -> ${targetChain.canonical_bridge}`,
          userId,
        })
      )
    );

    return right({
      bridged: true,
      sources: bridgeResults.map((br) => ({
        from: br.plan.chain.canonical_bridge,
        amount: br.plan.amountHuman,
      })),
    });
  }
}