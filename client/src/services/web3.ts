import { deposit, redeem } from "@0xintuition/sdk";
import { Address, parseEther} from "viem";
import { getWalletClient, getPublicClient } from "../lib/viem";

// --- Deposit / Support or Oppose function ---
export const buyShares = async (amountTrust: string, termId: Address, curveId = 1n) => {
  const walletClient = getWalletClient();
  const publicClient = getPublicClient();

  if (!walletClient || !publicClient) {
    throw new Error("wallet not installed or connected");
  }

  const { transactionHash } = await deposit(
    { walletClient, publicClient, address: walletClient.account?.address }, // address?
    [
      walletClient.account?.address, // receiver
      termId,                       // termId (atom or triple ID)
      curveId,                // curveId (use 1 for default curve - exponential, use 2 for linear)
      parseEther(amountTrust),               // assets (amount to deposit)
    ]
  )

  return transactionHash;
};

// --- Sell / Redeem ---
export const sellShares = async (sharesAmount: string, termId: Address, curveId = 1n) => {
  const walletClient = getWalletClient();
  const publicClient = getPublicClient();

  if (!walletClient || !walletClient?.account || !publicClient) {
    throw new Error("wallet not installed or connected");
  }

  const { transactionHash } = await redeem(
    { walletClient, publicClient, address: walletClient.account?.address },
    [
      walletClient.account?.address, // receiver
      termId,                       // termId
      curveId,                      // curveId (use 1 for default curve)
      parseEther(sharesAmount),                // shares amount
      0n,                          // minAssets (minimum assets to receive)
    ]
  );

  return transactionHash;
};
