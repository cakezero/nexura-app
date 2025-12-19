import chain from "./chain";
import { getWalletClient } from "./viem";
import { parseAbi, type Address } from "viem";

export const createCampaignOnchain = async () => {
  try {

  } catch (error: any) {
  console.error(error);
  throw new Error(error.message);
  }
}

export const claimCampaignOnchainReward = async ({ campaignAddress, userId }: { campaignAddress: string, userId: string }) => {
  try {
    const walletClient = getWalletClient();

    await walletClient.writeContract({
      address: campaignAddress as Address,
      abi: parseAbi(["function claimReward(string memory userId)"]),
      functionName: "claimReward",
      args: [userId],
      account: walletClient.account!.address,
      chain
    });
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message);
  }
}
