import { calculateAtomId } from "@0xintuition/sdk";
import { getAddress, isAddress, toHex, type Hex } from "viem";
import { DEV_ACCESS_ON } from "@/lib/devAccess";
import { getNetwork } from "@/lib/runtimeNetwork";

export const isSocialGraphOn = () =>
  DEV_ACCESS_ON || (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname));

export const graphqlUrl = () =>
  getNetwork() === "mainnet" ? "https://mainnet.intuition.sh/v1/graphql" : "https://testnet.intuition.sh/v1/graphql";

export const CHECKER = (() => {
  const raw = process.env.NEXT_PUBLIC_GRAPH_CHECKER?.trim();
  return raw && isAddress(raw) ? getAddress(raw) : null;
})();

export const textAtom = (label: string): Hex => toHex(label);
export const accountAtom = (address: string): Hex => toHex(getAddress(address));
export const idOf = (data: Hex) => calculateAtomId(data) as Hex;
export const accountAtomId = (address: string) => idOf(accountAtom(address));

export const ATOM = {
  I: "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b",
  trusts: "0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9",
  recommends: "0x3e2718cc4288b5b32fb65fed9e439c35419026f5b24f02e87264dbd48f0f52bf",
  hasTag: "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
} as const satisfies Record<string, Hex>;

export const TAG_LABEL = "Nexura project";
export const CHECKED_LABEL = "checked";
export const SPONSORS_LABEL = "sponsors";
export const CAMPAIGN_LABEL = "has Nexura campaign";
export const CLAIM_LABEL = "is";
export const SUGGESTED_CLAIMS = {
  person: ["a reliable builder", "a helpful community member", "a trusted reviewer", "an early supporter", "a bot", "a scammer"],
  project: ["legit", "beginner friendly", "actively building", "audited", "abandoned", "a scam"],
} as const;
export const campaignObject = (campaignId: string) => `nexura:campaign:${campaignId}`;
export const invitedLabel = (campaignId: string) => `invited to ${campaignObject(campaignId)}`;

export const INFO_FIELDS = [
  { key: "x", label: "X", predicate: "has X account", multi: false, placeholder: "https://x.com/…" },
  { key: "discord", label: "Discord", predicate: "has Discord", multi: false, placeholder: "https://discord.gg/…" },
  { key: "docs", label: "Docs", predicate: "has documentation", multi: false, placeholder: "https://" },
  { key: "tokenomics", label: "Tokenomics", predicate: "has tokenomics", multi: false, placeholder: "https://" },
  { key: "roadmap", label: "Roadmap", predicate: "has roadmap", multi: false, placeholder: "https://" },
  { key: "token", label: "Token contract", predicate: "has token", multi: false, placeholder: "0x…" },
  { key: "market", label: "CoinGecko / CoinMarketCap", predicate: "has market page", multi: false, placeholder: "https://" },
  { key: "team", label: "Team", predicate: "has team member", multi: true, placeholder: "Name or https://x.com/…" },
  { key: "investors", label: "Investors", predicate: "backed by", multi: true, placeholder: "Name or link" },
  { key: "ambassadors", label: "Ambassadors", predicate: "has ambassador", multi: true, placeholder: "Name, wallet or link" },
] as const;

export type InfoKey = (typeof INFO_FIELDS)[number]["key"];
export const infoByPredicate = Object.fromEntries(INFO_FIELDS.map((f) => [idOf(textAtom(f.predicate)), f]));

export const short = (a: string) => (a && a.length > 12 ? `${a.slice(0, 6)}…` : a);
