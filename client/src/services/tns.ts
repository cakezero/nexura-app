import { TNSClient } from "@samoris/tns-sdk";

const tns = new TNSClient();

export const getTrustUsername = async (input: string) => {
  try {
    if (!input) return null;

    console.log("DISPLAY INPUT:", input);

    const label = await tns.displayName(input);

    console.log("DISPLAY RESULT:", label);

    return label || null;
  } catch (err) {
    console.error("getTrustUsername error:", err);
    return null;
  }
};