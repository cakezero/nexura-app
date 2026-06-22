import { network } from "./constants";

type Network = "testnet" | "mainnet";

// TEMPORARY (2026-06-12): the client network is pinned to mainnet and does NOT
// depend on the server. To restore server-driven resolution, revert this file to
// the runtime-fetch version:
//   import { network as buildTimeNetwork, BACKEND_URL } from "./constants";
//   let resolvedNetwork: Network | null = null;
//   getNetwork = () => resolvedNetwork ?? buildTimeNetwork;
//   initNetworkFromServer fetches `${BACKEND_URL}/api/studio-payment-config`
//   and sets resolvedNetwork from data.network.
export const getNetwork = (): Network => network;

export const initNetworkFromServer = async (): Promise<void> => {
  // no-op: network is pinned to mainnet above; no server fetch.
};
