import { type WalletClient, type Address, type PublicClient, http, custom, createWalletClient, createPublicClient } from "viem";
import chain from "./chain";

let walletClient: WalletClient | undefined = undefined;
let publicClient: PublicClient | undefined = undefined;

export const getPublicClient = () => {
  if (typeof window === 'undefined') {
    console.error("window is undefined");
    return null
  };

  const provider = (window as any).ethereum;

  if (!provider) {
    console.error("No Ethereum provider found");
    return null;
  }

  if (!publicClient) {
    publicClient = createPublicClient({
      chain,
      transport: custom(provider)
    });
    
    return publicClient;
  }

  return publicClient;
};

export const getWalletClient = async () => {
  if (typeof window === 'undefined') {
    console.error("window is undefined");
    return null
  };

  const [account] = await window.ethereum!.request({ method: 'eth_requestAccounts' });

  if (!walletClient) {
    walletClient = createWalletClient({
      chain,
      account,
      transport: http()
    });

    return walletClient;
  }

  return walletClient;
}
