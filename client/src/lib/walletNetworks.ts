export type WalletNetwork = {
  id: number;
  name: string;
  icon: string;
  /** Badge behind the mark. White logos (Mantle, Intuition) need black. */
  iconBg: "white" | "black";
  rpc: string;
  explorer: string;
  native: { name: string; symbol: string; decimals: number };
  group: "intuition" | "ethereum" | "l2";
};

const ETH = { name: "Ether", symbol: "ETH", decimals: 18 };

function l2(
  net: Omit<WalletNetwork, "native" | "group" | "iconBg"> & {
    native?: WalletNetwork["native"];
    iconBg?: WalletNetwork["iconBg"];
  }
): WalletNetwork {
  return {
    native: ETH,
    group: "l2",
    iconBg: "white",
    ...net,
  };
}

export const WALLET_NETWORKS: WalletNetwork[] = [
  {
    id: 1155,
    name: "Intuition",
    icon: "/chains/intuition.png",
    iconBg: "black",
    rpc: "https://rpc.intuition.systems",
    explorer: "https://explorer.intuition.systems",
    native: { name: "Trust", symbol: "TRUST", decimals: 18 },
    group: "intuition",
  },
  {
    id: 13579,
    name: "Intuition Testnet",
    icon: "/chains/intuition.png",
    iconBg: "black",
    rpc: "https://testnet.rpc.intuition.systems",
    explorer: "https://testnet.explorer.intuition.systems",
    native: { name: "tTRUST", symbol: "tTRUST", decimals: 18 },
    group: "intuition",
  },
  {
    id: 1,
    name: "Ethereum",
    icon: "/chains/ethereum.svg",
    iconBg: "white",
    rpc: "https://ethereum.publicnode.com",
    explorer: "https://etherscan.io",
    native: ETH,
    group: "ethereum",
  },
  l2({ id: 8453, name: "Base", icon: "/chains/base.svg", rpc: "https://mainnet.base.org", explorer: "https://basescan.org" }),
  l2({ id: 42161, name: "Arbitrum One", icon: "/chains/arbitrum.svg", rpc: "https://arb1.arbitrum.io/rpc", explorer: "https://arbiscan.io" }),
  l2({ id: 10, name: "Optimism", icon: "/chains/optimism.svg", rpc: "https://mainnet.optimism.io", explorer: "https://optimistic.etherscan.io" }),
  l2({
    id: 137,
    name: "Polygon",
    icon: "/chains/polygon.svg",
    rpc: "https://polygon-bor.publicnode.com",
    explorer: "https://polygonscan.com",
    native: { name: "POL", symbol: "POL", decimals: 18 },
  }),
  l2({ id: 324, name: "zkSync Era", icon: "/chains/zksync.svg", rpc: "https://mainnet.era.zksync.io", explorer: "https://explorer.zksync.io" }),
  l2({ id: 59144, name: "Linea", icon: "/chains/linea.svg", rpc: "https://rpc.linea.build", explorer: "https://lineascan.build" }),
  l2({ id: 534352, name: "Scroll", icon: "/chains/scroll.svg", rpc: "https://rpc.scroll.io", explorer: "https://scrollscan.com" }),
  l2({
    id: 5000,
    name: "Mantle",
    icon: "/chains/mantle.svg",
    iconBg: "black",
    rpc: "https://rpc.mantle.xyz",
    explorer: "https://mantlescan.xyz",
    native: { name: "Mantle", symbol: "MNT", decimals: 18 },
  }),
  l2({ id: 81457, name: "Blast", icon: "/chains/blast.svg", rpc: "https://rpc.blast.io", explorer: "https://blastscan.io" }),
  l2({
    id: 42220,
    name: "Celo",
    icon: "/chains/celo.svg",
    rpc: "https://forno.celo.org",
    explorer: "https://celoscan.io",
    native: { name: "CELO", symbol: "CELO", decimals: 18 },
  }),
  l2({ id: 130, name: "Unichain", icon: "/chains/unichain.svg", rpc: "https://mainnet.unichain.org", explorer: "https://uniscan.xyz" }),
  l2({ id: 480, name: "World Chain", icon: "/chains/worldchain.svg", rpc: "https://worldchain-mainnet.g.alchemy.com/public", explorer: "https://worldscan.org" }),
  l2({ id: 57073, name: "Ink", icon: "/chains/ink.svg", rpc: "https://rpc-gel.inkonchain.com", explorer: "https://explorer.inkonchain.com" }),
  l2({ id: 7777777, name: "Zora", icon: "/chains/zora.svg", rpc: "https://rpc.zora.energy", explorer: "https://explorer.zora.energy" }),
  l2({ id: 167000, name: "Taiko", icon: "/chains/taiko.svg", rpc: "https://rpc.mainnet.taiko.xyz", explorer: "https://taikoscan.io" }),
  l2({
    id: 1088,
    name: "Metis",
    icon: "/chains/metis.svg",
    rpc: "https://andromeda.metis.io/?owner=1088",
    explorer: "https://andromeda-explorer.metis.io",
    native: { name: "Metis", symbol: "METIS", decimals: 18 },
  }),
  l2({
    id: 204,
    name: "opBNB",
    icon: "/chains/opbnb.webp",
    rpc: "https://opbnb-mainnet-rpc.bnbchain.org",
    explorer: "https://opbnbscan.com",
    native: { name: "BNB", symbol: "BNB", decimals: 18 },
  }),
  l2({
    id: 33139,
    name: "ApeChain",
    icon: "/chains/apechain.svg",
    rpc: "https://rpc.apechain.com",
    explorer: "https://apescan.io",
    native: { name: "ApeCoin", symbol: "APE", decimals: 18 },
  }),
  l2({ id: 1868, name: "Soneium", icon: "/chains/soneium.webp", rpc: "https://rpc.soneium.org", explorer: "https://soneium.blockscout.com" }),
  l2({ id: 2741, name: "Abstract", icon: "/chains/abstract.svg", rpc: "https://api.mainnet.abs.xyz", explorer: "https://abscan.org" }),
  l2({ id: 1101, name: "Polygon zkEVM", icon: "/chains/polygon-zkevm.webp", rpc: "https://zkevm-rpc.com", explorer: "https://zkevm.polygonscan.com" }),
  l2({ id: 34443, name: "Mode", icon: "/chains/mode.svg", rpc: "https://mainnet.mode.network", explorer: "https://explorer.mode.network" }),
  l2({
    id: 252,
    name: "Fraxtal",
    icon: "/chains/fraxtal.svg",
    rpc: "https://rpc.frax.com",
    explorer: "https://fraxscan.com",
    native: { name: "Frax", symbol: "FRAX", decimals: 18 },
  }),
  l2({ id: 169, name: "Manta Pacific", icon: "/chains/manta.svg", rpc: "https://pacific-rpc.manta.network/http", explorer: "https://pacific-explorer.manta.network" }),
  l2({
    id: 13371,
    name: "Immutable zkEVM",
    icon: "/chains/immutable.svg",
    rpc: "https://rpc.immutable.com",
    explorer: "https://explorer.immutable.com",
    native: { name: "IMX", symbol: "IMX", decimals: 18 },
  }),
  l2({ id: 288, name: "Boba", icon: "/chains/boba.png", rpc: "https://mainnet.boba.network", explorer: "https://bobascan.com" }),
  l2({ id: 60808, name: "BOB", icon: "/chains/bob.svg", rpc: "https://rpc.gobob.xyz", explorer: "https://explorer.gobob.xyz" }),
  l2({ id: 1135, name: "Lisk", icon: "/chains/lisk.svg", rpc: "https://rpc.api.lisk.com", explorer: "https://blockscout.lisk.com" }),
  l2({ id: 185, name: "Mint", icon: "/chains/mint.svg", rpc: "https://rpc.mintchain.io", explorer: "https://explorer.mintchain.io" }),
  l2({ id: 360, name: "Shape", icon: "/chains/shape.webp", rpc: "https://mainnet.shape.network", explorer: "https://shapescan.xyz" }),
  l2({ id: 48900, name: "Zircuit", icon: "/chains/zircuit.svg", rpc: "https://mainnet.zircuit.com", explorer: "https://explorer.zircuit.com" }),
  l2({ id: 1923, name: "Swellchain", icon: "/chains/swell.svg", rpc: "https://swell-mainnet.alt.technology", explorer: "https://explorer.swellnetwork.io" }),
  l2({ id: 7560, name: "Cyber", icon: "/chains/cyber.webp", rpc: "https://cyber.alt.technology", explorer: "https://cyberscan.co" }),
  l2({ id: 888888888, name: "Ancient8", icon: "/chains/ancient8.webp", rpc: "https://rpc.ancient8.gg", explorer: "https://scan.ancient8.gg" }),
  l2({ id: 690, name: "Redstone", icon: "/chains/redstone.webp", rpc: "https://rpc.redstonechain.com", explorer: "https://explorer.redstone.xyz" }),
  l2({
    id: 1625,
    name: "Gravity",
    icon: "/chains/gravity.svg",
    rpc: "https://rpc.gravity.xyz",
    explorer: "https://explorer.gravity.xyz",
    native: { name: "G", symbol: "G", decimals: 18 },
  }),
  l2({
    id: 660279,
    name: "Xai",
    icon: "/chains/xai.svg",
    rpc: "https://xai-chain.net/rpc",
    explorer: "https://explorer.xai-chain.net",
    native: { name: "XAI", symbol: "XAI", decimals: 18 },
  }),
];

export const WALLET_NETWORK_BY_ID = new Map(WALLET_NETWORKS.map((net) => [net.id, net]));

export function hexChainId(id: number) {
  return `0x${id.toString(16)}`;
}

export function parseChainId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, value.startsWith("0x") ? 16 : 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
