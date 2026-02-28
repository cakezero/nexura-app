import { deposit, redeem } from "@0xintuition/sdk";
import { Address, parseEther} from "viem";
import { getWalletClient, getPublicClient } from "../lib/viem";

// --- Deposit / Support or Oppose function ---
export const buyShares = async (amountTrust: string, termId: Address, curveId = 1n) => {
  const walletClient = await getWalletClient();
  const publicClient = getPublicClient();

  const { transactionHash } = await deposit(
    { walletClient, publicClient, address: "0x" },
      [
        walletClient?.account?.address as "0x", // receiver
        termId,                       // termId (atom or triple ID)
        curveId,                
        0n,               // assets (amount to deposit)
      ]
  )

  return transactionHash;
};

// --- Sell / Redeem ---
export const sellShares = async (sharesAmount: string, termId: Address, curveId = 1n) => {
  const walletClient = await getWalletClient();
  const publicClient = getPublicClient();

  const { transactionHash } = await redeem(
    { walletClient, publicClient, address: "" as `0x${string}` },
    {
      args: [
      walletClient?.account?.address, // receiver
      termId,                       // termId
      curveId,                      // curveId (use 1 for default curve)
      parseEther(sharesAmount),                // shares amount
      0n
      ]
    },
  );

  return transactionHash;
};
