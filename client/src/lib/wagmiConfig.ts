import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import chain, { getChain } from "./chain";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "PLACEHOLDER";

export const wagmiConfig = getDefaultConfig({
  appName: "Nexura",
  projectId: walletConnectProjectId,
  chains: [chain],
});

let activeConfig: ReturnType<typeof getDefaultConfig> = wagmiConfig;

export const buildWagmiConfig = () => {
  activeConfig = getDefaultConfig({
    appName: "Nexura",
    projectId: walletConnectProjectId,
    chains: [getChain()],
  });
  return activeConfig;
};

export const getActiveWagmiConfig = () => activeConfig;
