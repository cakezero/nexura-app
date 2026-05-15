import { TNSProvider } from "@samoris/tns-sdk";

const provider = new TNSProvider();

/**
 * Resolve a .trust name → wallet address
 * Returns null if name does not exist
 */
export const resolveTNSName = async (name: string) => {
  try {
    const address = await provider.resolveName(name);
    return address; // string | null
  } catch (err) {
    console.error("resolveTNSName error:", err);
    return null;
  }
};

/**
 * Lookup wallet address → .trust name
 * Returns null if no name is linked
 */
export const lookupTNSAddress = async (address: string) => {
  try {
    const provider = new TNSProvider();

    const name = await provider.lookupAddress(address);

    return {
      success: true,
      name,
      error: null,
    };
  } catch (err) {
    console.error("lookupTNSAddress error:", err);

    return {
      success: false,
      name: null,
      error: err,
    };
  }
};

/**
 * Check if a .trust username is available
 * Rule:
 * - If resolveName returns null → AVAILABLE
 * - If it returns address → UNAVAILABLE
 */
export const checkTNSAvailability = async (name: string) => {
  try {
    const result = await provider.resolveName(name);
    return result === null;
  } catch (err) {
    console.error("checkTNSAvailability error:", err);
    return false;
  }
};