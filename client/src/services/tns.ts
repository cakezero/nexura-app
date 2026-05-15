import { TNSClient } from "@samoris/tns-sdk";

const tns = new TNSClient();

/**
 * Returns best human-readable identity:
 * - "alice.trust" if user has primary name
 * - "0x1234...abcd" if not
 */
export const getTrustUsername = async (input: string) => {
  try {
    if (!input) return null;

    console.log("========== TNS DISPLAY REQUEST ==========");
    console.log("INPUT:", input);

    const label = await tns.displayName(input);

    console.log("DISPLAY RESULT:", label);
    console.log("========================================");

    return label ?? null;
  } catch (err) {
    console.error("getTrustUsername error:", err);
    return null;
  }
};