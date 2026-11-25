"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { isAddress } from "viem";
import { apiRequestV2 } from "@/lib/queryClient";
import { listProject, type ProjectInput } from "@/lib/socialGraph/actions";
import { INFO_FIELDS, type InfoKey } from "@/lib/socialGraph/config";
import { findByWebsite, type Project } from "@/lib/socialGraph/graph";
import { useGraph } from "./context";
import { Field, GhostButton, INPUT, Modal, Notice, PrimaryButton, useAction } from "./kit";

const isLink = (v: string) => { try { return /^https?:$/.test(new URL(v).protocol); } catch { return false; } };
export const MIN_DYOR = Math.ceil(INFO_FIELDS.length / 2);
const LINK_FIELDS = new Set<InfoKey>(["x", "discord", "docs", "tokenomics", "roadmap", "market"]);

const fieldProblem = (key: InfoKey, raw: string) => {
  const v = raw.trim();
  if (!v) return null;
  if (LINK_FIELDS.has(key)) return isLink(v) ? null : "Must be a link starting with https://";
  if (key === "token") return isAddress(v) ? null : "Must be a contract address (0x…)";
  return v.split("\n").some((x) => x.trim().length > 120) ? "Keep each entry under 120 characters" : null;
};

export default function ListProjectModal() {
  const g = useGraph();
  const { busy, run } = useAction();
  const [form, setForm] = useState({ name: "", website: g.listOpen?.website ?? "", description: "", image: "" });
  const [info, setInfo] = useState<Partial<Record<InfoKey, string>>>({});
  const [check, setCheck] = useState(true);
  const [existing, setExisting] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const website = form.website.trim();
  useEffect(() => {
    if (!isLink(website)) { setExisting(null); return; }
    const t = setTimeout(async () => setExisting(await findByWebsite(website, g.projects ?? undefined).catch(() => null)), 300);
    return () => clearTimeout(t);
  }, [website, g.projects]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const upload = async (f: File) => {
    setUploadError(null);
    if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) { setUploadError("Use a PNG, JPG, WEBP or GIF"); return; }
    if (f.size > 1_000_000) { setUploadError("The logo must be under 1 MB"); return; }
    setUploading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
      });
      const { url } = await apiRequestV2("POST", "/api/graph/logo", { data, contentType: f.type, filename: f.name });
      setForm((x) => ({ ...x, image: url }));
    } catch (e: any) {
      setUploadError(e?.message ?? "Couldn't upload the logo");
    } finally {
      setUploading(false);
    }
  };

  const filled = INFO_FIELDS.filter((f) => info[f.key]?.trim()).length;
  const badField = INFO_FIELDS.map((f) => ({ f, p: fieldProblem(f.key, info[f.key] ?? "") })).find((x) => x.p);
  const problem =
    !form.name.trim() ? "Enter the project name"
    : !isLink(website) ? "Enter the website, starting with https://"
    : existing ? "This project is already listed"
    : form.description.trim().length < 20 ? "Describe what it does (at least 20 characters)"
    : !/^(https?|ipfs):\/\//.test(form.image.trim()) ? "Add the project logo"
    : badField ? `${badField.f.label}: ${badField.p}`
    : filled < MIN_DYOR ? `Fill at least ${MIN_DYOR} of the ${INFO_FIELDS.length} DYOR fields (${filled} so far)`
    : null;

  const submit = async () => {
    if (problem) return;
    const values: ProjectInput["info"] = {};
    for (const f of INFO_FIELDS) {
      const raw = info[f.key]?.trim();
      if (raw) values[f.key] = f.multi ? raw.split("\n").map((v) => v.trim()).filter(Boolean) : [raw];
    }
    let id = "";
    const ok = await run("list", async () => { id = await listProject({ ...form, info: values }, { check: g.isChecker && check }); }, `${form.name.trim()} is listed`, g.refresh);
    if (ok && id) { g.closeList(); g.openProject(id); }
  };

  return (
    <Modal wide title="List a project" onClose={g.closeList}
      footer={<>
        <span className={`mr-auto text-[12px] ${problem ? "text-[#69728a]" : "text-[#0b8a6a]"}`}>{problem ?? "Ready. Free to list; your wallet signs and pays the gas."}</span>
        <GhostButton onClick={g.closeList}>Cancel</GhostButton>
        <PrimaryButton busy={busy === "list"} disabled={!!problem || uploading} onClick={submit}>List project</PrimaryButton>
      </>}>
      <div className="space-y-[14px]">
        <div className="flex gap-[14px]">
          <button type="button" onClick={() => file.current?.click()} aria-label="Upload logo"
            className="relative flex size-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] border-[1.25px] border-dashed border-[rgba(138,63,252,0.45)] bg-[#f7f4fe] text-[#8a3ffc] hover:bg-[#efeafb]">
            {uploading ? <Loader2 className="size-[22px] animate-spin" />
              : form.image ? <img src={form.image.replace(/^ipfs:\/\//, "https://ipfs.io/ipfs/")} alt="Logo" className="size-full object-cover" />
              : <span className="flex flex-col items-center gap-[2px] text-[11px] font-semibold"><ImagePlus className="size-[20px]" />Logo</span>}
          </button>
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          <div className="grid flex-1 gap-[10px] sm:grid-cols-2">
            <Field label="Project name"><input className={INPUT} value={form.name} onChange={set("name")} maxLength={80} autoFocus /></Field>
            <Field label="Website"><input className={INPUT} value={form.website} onChange={set("website")} placeholder="https://" maxLength={300} /></Field>
            <div className="sm:col-span-2">
              <Field label="Logo" hint={uploadError ?? "Upload an image (under 1 MB) or paste a link."}>
                <input className={INPUT} value={form.image} onChange={set("image")} placeholder="https://… or upload" maxLength={500} />
              </Field>
            </div>
          </div>
        </div>
        {existing && (
          <Notice tone="warn">
            {existing.name} is already listed. <button type="button" className="font-semibold underline" onClick={() => { g.closeList(); g.openProject(existing.id); }}>Open it</button> to recommend it or add info.
          </Notice>
        )}
        <Field label="What does it do?"><textarea className={`${INPUT} !h-[76px] py-[10px]`} value={form.description} onChange={set("description")} maxLength={500} /></Field>

        <div className="rounded-[24px] bg-[#f7f4fe] p-[16px]">
          <div className="mb-[10px] flex items-center justify-between gap-[10px]">
            <p className="text-[14px] font-semibold">DYOR info</p>
            <span className={`rounded-[40px] px-[10px] py-[3px] text-[12px] font-semibold ${filled >= MIN_DYOR ? "bg-[rgba(15,179,138,0.12)] text-[#0b8a6a]" : "bg-white text-[#69728a]"}`}>{filled} of {INFO_FIELDS.length} · at least {MIN_DYOR}</span>
          </div>
          <div className="grid gap-[10px] sm:grid-cols-2">
            {INFO_FIELDS.map((f) => {
              const err = fieldProblem(f.key, info[f.key] ?? "");
              return (
                <Field key={f.key} label={f.label} hint={err ?? (f.multi ? "One per line" : undefined)}>
                  {f.multi
                    ? <textarea className={`${INPUT} !h-[64px] !bg-white py-[10px] ${err ? "!border-[#e4545b]" : ""}`} value={info[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setInfo((v) => ({ ...v, [f.key]: e.target.value }))} />
                    : <input className={`${INPUT} !bg-white ${err ? "!border-[#e4545b]" : ""}`} value={info[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setInfo((v) => ({ ...v, [f.key]: e.target.value }))} />}
                </Field>
              );
            })}
          </div>
        </div>

        {g.isChecker && (
          <label className="flex items-center gap-[10px] rounded-[20px] bg-[#f7f4fe] px-[14px] py-[12px] text-[13px]">
            <input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} className="size-[16px] accent-[#8b3efe]" />
            Add the Nexura check (we researched and reached out to this project)
          </label>
        )}
      </div>
    </Modal>
  );
}
