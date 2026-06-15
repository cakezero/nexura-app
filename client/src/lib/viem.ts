import { type WalletClient, type PublicClient } from "viem";
import {
  getWalletClient as coreGetWalletClient,
  getPublicClient as coreGetPublicClient,
} from "@wagmi/core";
import { getActiveWagmiConfig } from "./wagmiConfig";
import { getChain } from "./chain";

const NO_WALLET_MSG =
  "No wallet provider available. Connect a wallet with RainbowKit first.";

export const getPublicClient = (): PublicClient => {
  const client = coreGetPublicClient(getActiveWagmiConfig(), { chainId: getChain().id });
  if (!client) {
    throw new Error(NO_WALLET_MSG);
  }
  return client as unknown as PublicClient;
};

export const getWalletClient = async (): Promise<WalletClient> => {
  try {
    const client = await coreGetWalletClient(getActiveWagmiConfig(), { chainId: getChain().id });
    if (!client) {
      throw new Error(NO_WALLET_MSG);
    }
    return client as unknown as WalletClient;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      /connector|not connected|no wallet/i.test(msg)
    ) {
      throw new Error(NO_WALLET_MSG);
    }
    throw err;
  }
};
