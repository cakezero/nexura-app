import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getPublicClient } from "./viem";
import { WalletClient } from "viem";
import { MULTIVAULT_ADDRESS, PROXY_FEE_CONTRACT, MULTIVAULT_ABI } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

export const formatNumber = (amount: number, place = "") => {
  if (amount >= 1_000_000_000_000) return (amount / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "") + "T";
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (amount >= 1_000) return (amount / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  if (amount < 1_000) {
    if (place === "") return amount.toFixed(2);
  };
  return amount.toString();
};

export const getIntuitionNetworkParams = (isTestnet: boolean, chainId: string) => {
  return [{
		chainId,
		chainName: `Intuition ${isTestnet ? "Testnet" : "Mainnet"}`,
		nativeCurrency: {
			name: "Trust",
			symbol: "TRUST",
			decimals: 18,
		},
		rpcUrls: [
			isTestnet
				? "https://testnet.rpc.intuition.systems"
				: "https://rpc.intuition.systems",
		],
		blockExplorerUrls: [
			isTestnet
				? "https://testnet.explorer.intuition.systems"
				: "https://explorer.intuition.systems",
		],
	}];
};

export const allowToDeposit = async (walletClient: WalletClient, account: "0x") => {
  try {
    const publicClient = getPublicClient();

    const { request } = await publicClient.simulateContract({
      abi: MULTIVAULT_ABI,
      address: MULTIVAULT_ADDRESS,
      args: [PROXY_FEE_CONTRACT, 1],
      functionName: "approve",
      account
    });

    await walletClient.writeContract(request);
  } catch (error: any) {
    throw new Error(error.message);
  }
}