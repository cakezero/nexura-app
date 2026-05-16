import { TNSProvider } from "@samoris/tns-sdk";

async function run() {
  const provider = new TNSProvider();

  console.log("1. Resolving name...");
  const addr = await provider.resolveName("alice.trust");
  console.log("ADDRESS:", addr);

  console.log("2. Reverse lookup...");
  const name = await provider.lookupAddress(
    "0x15EE5667AF9a2342b18AB9737CDf7D483d8C4936"
  );
  console.log("NAME:", name);
}

run().catch(console.error);