import { TNSProvider } from "@samoris/tns-sdk";

const provider = new TNSProvider();

/**
 * Get .trust name for a wallet (best-effort)
 * - tries reverse lookup first
 * - if none, returns null
 */
export const getTrustUsername = async (address: string) => {
  try {
    if (!address) return null;

    console.log("CHECKING TRUST NAME FOR:", address);

    const name = await provider.lookupAddress(address);

    console.log("RESULT:", name);

    return name || null;
  } catch (err) {
    console.error("getTrustUsername error:", err);
    return null;
  }
};