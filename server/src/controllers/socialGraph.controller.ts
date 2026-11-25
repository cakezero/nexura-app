import logger from "@/config/logger";
import { user } from "@/models/user.model";
import { computeRetention } from "@/utils/retention";
import { TRUST_WEIGHT } from "@/utils/graphTrust";
import { serverWalletAddress } from "@/utils/account";
import { inviteSettings } from "@/controllers/graphInvite.controller";
import { GRAPH_ATTEST_ENABLED } from "@/utils/graphContributions";
import { network } from "@/utils/env.utils";
import { OUTBOUND_TIMEOUT_MS } from "@/utils/resilience";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "@/utils/status.utils";

const PIN_URL = "https://pin.intuition.systems/v1/graphql";
const PIN_API_KEY = process.env.INTUITION_PIN_API_KEY?.trim() ?? "";
if (!PIN_API_KEY) logger.warn("INTUITION_PIN_API_KEY isn't set: listing projects on the social graph is off");

const PIN_THING = `mutation pinThing($name: String!, $description: String, $image: String, $url: String) {
  pinThing(thing: { name: $name, description: $description, image: $image, url: $url }) { uri }
}`;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim() : "").slice(0, max + 1);
const isLink = (v: string, schemes = /^https?:$/) => { try { return schemes.test(new URL(v).protocol); } catch { return false; } };

export const pinProject = async (req: GlobalRequest, res: GlobalResponse) => {
  const name = text(req.body?.name, 80);
  const url = text(req.body?.url, 300);
  const description = text(req.body?.description, 500);
  const image = text(req.body?.image, 500);

  if (!name || name.length > 80) { res.status(BAD_REQUEST).json({ error: "Enter the project name (up to 80 characters)" }); return; }
  if (!isLink(url) || url.length > 300) { res.status(BAD_REQUEST).json({ error: "Enter the project's website, starting with https://" }); return; }
  if (description.length < 20 || description.length > 500) { res.status(BAD_REQUEST).json({ error: "Describe what the project does (20 to 500 characters)" }); return; }
  if (!image || !isLink(image, /^(https?|ipfs):$/) || image.length > 500) { res.status(BAD_REQUEST).json({ error: "Add the project logo (a link starting with https:// or ipfs://)" }); return; }
  if (!PIN_API_KEY) { res.status(INTERNAL_SERVER_ERROR).json({ error: "Listing projects isn't set up yet" }); return; }

  try {
    const r = await fetch(PIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: PIN_API_KEY },
      body: JSON.stringify({ query: PIN_THING, variables: { name, url, description: description || undefined, image: image || undefined } }),
      signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS),
    });
    const json: any = await r.json().catch(() => null);
    const uri = json?.data?.pinThing?.uri;
    if (!r.ok || typeof uri !== "string" || !/^ipfs:\/\/[a-zA-Z0-9]+$/.test(uri)) {
      logger.error(`pinProject: pinning failed (${r.status}) ${JSON.stringify(json?.errors ?? json?.message ?? "").slice(0, 300)}`);
      res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't save the project details. Try again." });
      return;
    }
    res.status(OK).json({ uri });
  } catch (error: any) {
    logger.error(`pinProject: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't save the project details. Try again." });
  }
};

export const graphScore = async (req: GlobalRequest, res: GlobalResponse) => {
  const address = String(req.params.address ?? "");
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) { res.status(BAD_REQUEST).json({ error: "Not a wallet address" }); return; }
  try {
    const u = await user.findOne({ address: address.toLowerCase() }).select("_id").lean() as any;
    if (!u) { res.status(OK).json({ onNexura: false, nexuraScore: null, retention: null, trust: null, campaigns: 0 }); return; }
    const r = (await computeRetention([String(u._id)])).get(String(u._id));
    res.status(OK).json({ onNexura: true, nexuraScore: r?.nexuraScore ?? null, retention: r?.retentionScore ?? null, trust: r?.trust ?? 0, trustWeight: TRUST_WEIGHT, campaigns: r?.campaigns ?? 0 });
  } catch (error: any) {
    logger.error(`graphScore: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't load the Nexura score" });
  }
};


export const graphScores = async (req: GlobalRequest, res: GlobalResponse) => {
  const list = String(req.query.addresses ?? "").split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);
  const addresses = [...new Set(list)];
  if (!addresses.length || addresses.length > 50 || addresses.some((a) => !/^0x[0-9a-f]{40}$/.test(a))) {
    res.status(BAD_REQUEST).json({ error: "Send 1 to 50 wallet addresses" });
    return;
  }
  try {
    const users = await user.find({ address: { $in: addresses } }).select("_id address").lean() as any[];
    const retention = await computeRetention(users.map((u) => String(u._id)));
    const scores: Record<string, { nexuraScore: number | null; retention: number | null; trust: number; campaigns: number }> = {};
    for (const u of users) {
      const r = retention.get(String(u._id));
      scores[String(u.address).toLowerCase()] = { nexuraScore: r?.nexuraScore ?? null, retention: r?.retentionScore ?? null, trust: r?.trust ?? 0, campaigns: r?.campaigns ?? 0 };
    }
    res.status(OK).json({ scores });
  } catch (error: any) {
    logger.error(`graphScores: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't load Nexura scores" });
  }
};

export const graphConfig = (_req: GlobalRequest, res: GlobalResponse) => {
  res.status(OK).json({ attester: serverWalletAddress(), contributionsOn: GRAPH_ATTEST_ENABLED, network, invites: inviteSettings() });
};

const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const UPLOAD_IMAGE = `mutation uploadImage($image: UploadImageInput!) { uploadImage(image: $image) { images { url safe } } }`;

export const uploadLogo = async (req: GlobalRequest, res: GlobalResponse) => {
  const contentType = String(req.body?.contentType ?? "");
  const data = String(req.body?.data ?? "").replace(/^data:[^;]+;base64,/, "");
  const filename = String(req.body?.filename ?? "logo").replace(/[^\w.-]/g, "_").slice(0, 80) || "logo";
  if (!LOGO_TYPES.has(contentType)) { res.status(BAD_REQUEST).json({ error: "The logo must be a PNG, JPG, WEBP or GIF" }); return; }
  if (!data || !/^[A-Za-z0-9+/=]+$/.test(data)) { res.status(BAD_REQUEST).json({ error: "Choose a logo image" }); return; }
  if (data.length > 1_400_000) { res.status(BAD_REQUEST).json({ error: "The logo must be under 1 MB" }); return; }
  if (!PIN_API_KEY) { res.status(INTERNAL_SERVER_ERROR).json({ error: "Logo upload isn't set up yet" }); return; }
  try {
    const r = await fetch(PIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: PIN_API_KEY },
      body: JSON.stringify({ query: UPLOAD_IMAGE, variables: { image: { contentType, data, filename } } }),
      signal: AbortSignal.timeout(30_000),
    });
    const json: any = await r.json().catch(() => null);
    const image = json?.data?.uploadImage?.images?.[0];
    if (!r.ok || !image?.url) {
      logger.error(`uploadLogo: failed (${r.status}) ${JSON.stringify(json?.errors ?? json?.message ?? "").slice(0, 300)}`);
      res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't upload the logo. Try another image." });
      return;
    }
    if (image.safe === false) { res.status(BAD_REQUEST).json({ error: "That image didn't pass the safety check. Use another logo." }); return; }
    res.status(OK).json({ url: String(image.url) });
  } catch (error: any) {
    logger.error(`uploadLogo: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't upload the logo. Try again." });
  }
};
