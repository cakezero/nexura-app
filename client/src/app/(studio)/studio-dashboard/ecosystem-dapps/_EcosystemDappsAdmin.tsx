"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Camera, Loader2, Plus, Trash2, ExternalLink, Image as ImageIcon, Pencil, X, Check
} from "lucide-react";
import { apiRequest } from "@/lib/config";
import { getStoredAdminInfo } from "@/lib/config";

type Dapp = {
  _id: string;
  name: string;
  description: string;
  logo: string;
  websiteUrl: string;
  reward: number;
  category: string;
  createdAt?: string;
};

const CATEGORIES = ["quests", "defi", "lending protocols", "prediction markets", "nft", "infrastructure", "ai", "social", "gaming", "tools", "portal", "identity", "reputation", "browser extension", "domain name", "launchpads"];

export default function EcosystemDappsAdmin() {
  const router = useRouter();
  const { toast } = useToast();

  const [dapps, setDapps] = useState<Dapp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [reward, setReward] = useState("0");
  const [category, setCategory] = useState("quests");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editReward, setEditReward] = useState("0");
  const [editCategory, setEditCategory] = useState("quests");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editOriginalLogo, setEditOriginalLogo] = useState("");

  const adminInfo = getStoredAdminInfo();
  const isSuperAdmin = adminInfo?.role === "superadmin";

  const fetchDapps = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ dapps: Dapp[] }>({
        endpoint: "/api/admin/get-ecosystem-dapps",
        method: "GET",
      });
      setDapps(res?.dapps ?? []);
    } catch (err) {
      console.error("Failed to fetch dapps:", err);
      toast({ title: "Error", description: "Failed to load ecosystem dapps.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDapps();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile(file);
      setImagePreview(reader.result as string);
      setLogoUrl("");
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditImageFile(file);
      setEditImagePreview(reader.result as string);
      setEditLogoUrl("");
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setWebsiteUrl("");
    setReward("0");
    setCategory("quests");
    setImageFile(null);
    setImagePreview("");
    setLogoUrl("");
  };

  const startEdit = (dapp: Dapp) => {
    setEditingId(dapp._id);
    setEditName(dapp.name);
    setEditDescription(dapp.description || "");
    setEditWebsiteUrl(dapp.websiteUrl || "");
    setEditReward(String(dapp.reward || 0));
    setEditCategory(dapp.category || "quests");
    setEditImageFile(null);
    setEditImagePreview("");
    setEditLogoUrl("");
    setEditOriginalLogo(dapp.logo || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditWebsiteUrl("");
    setEditReward("0");
    setEditCategory("quests");
    setEditImageFile(null);
    setEditImagePreview("");
    setEditLogoUrl("");
    setEditOriginalLogo("");
  };

  const handleCreate = async () => {
    console.log("[ACTION] EcosystemDappsAdmin.handleCreate");
    if (!name.trim()) {
      toast({ title: "Missing name", description: "Dapp name is required.", variant: "destructive" });
      return;
    }
    if (!websiteUrl.trim()) {
      toast({ title: "Missing URL", description: "Website URL is required.", variant: "destructive" });
      return;
    }
    if (!imageFile && !logoUrl.trim()) {
      toast({ title: "Missing logo", description: "Upload a logo image or provide a logo URL.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("description", description.trim());
      fd.append("websiteUrl", websiteUrl.trim());
      fd.append("reward", reward);
      fd.append("category", category);

      if (imageFile) {
        fd.append("logo", imageFile);
      } else if (logoUrl.trim()) {
        fd.append("logo", logoUrl.trim());
      }

      await apiRequest<{ message: string; logo?: string }>({
        endpoint: "/api/admin/create-ecosystem-dapp",
        method: "POST",
        formData: fd,
      });

      toast({ title: "Dapp created", description: `${name} has been added to the ecosystem.` });
      resetForm();
      fetchDapps();
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to create dapp.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (dappId: string) => {
    console.log("[ACTION] EcosystemDappsAdmin.handleUpdate", dappId);
    if (!editName.trim()) {
      toast({ title: "Missing name", description: "Dapp name is required.", variant: "destructive" });
      return;
    }
    if (!editWebsiteUrl.trim()) {
      toast({ title: "Missing URL", description: "Website URL is required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("description", editDescription.trim());
      fd.append("websiteUrl", editWebsiteUrl.trim());
      fd.append("reward", editReward);
      fd.append("category", editCategory);

      if (editImageFile) {
        fd.append("logo", editImageFile);
      } else if (editLogoUrl.trim()) {
        fd.append("logo", editLogoUrl.trim());
      }

      await apiRequest<{ message: string; logo?: string }>({
        endpoint: `/api/admin/update-ecosystem-dapp?id=${dappId}`,
        method: "PATCH",
        formData: fd,
      });

      toast({ title: "Dapp updated", description: `${editName} has been updated.` });
      cancelEdit();
      fetchDapps();
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to update dapp.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dapp: Dapp) => {
    console.log("[ACTION] EcosystemDappsAdmin.handleDelete", dapp._id);
    setDeleting(dapp._id);
    try {
      await apiRequest({
        endpoint: `/api/admin/delete-ecosystem-dapp?id=${dapp._id}`,
        method: "DELETE",
      });
      toast({ title: "Dapp deleted", description: `${dapp.name} has been removed.` });
      if (editingId === dapp._id) cancelEdit();
      fetchDapps();
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to delete dapp.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const displayPreview = imagePreview || logoUrl;
  const editDisplayPreview = editImagePreview || editLogoUrl || editOriginalLogo;

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/50">Only superadmins can manage ecosystem dapps.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Existing dapps count */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-500/20 text-purple-300 px-3 py-1">{dapps.length} listed</Badge>
        </div>
      </div>

      {/* Create form */}
      {!editingId && (
        <Card className="w-full max-w-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_40px_rgba(138,63,252,0.08)] mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Add New Dapp</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo upload */}
            <div className="space-y-3 md:col-span-2 flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-purple-500/60 shadow-lg shadow-purple-500/10 bg-purple-900/30 flex items-center justify-center">
                  {displayPreview ? (
                    <img
                      src={displayPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-white/30" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-[10px] text-white/80 font-medium">Upload</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    data-testid="dapp-logo-upload"
                  />
                </label>
              </div>
              <p className="text-xs text-white/40">Click to upload logo image</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Dapp Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Dapp"
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-purple-500/60"
                data-testid="dapp-name-input"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/15 text-white rounded-md px-3 py-2 text-sm focus:border-purple-500/60 focus:outline-none"
                data-testid="dapp-category-select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#1a1a2e] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Website URL *</Label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://mydapp.com"
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-purple-500/60"
                data-testid="dapp-url-input"
              />
            </div>

            {/* Reward */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">XP Reward</Label>
              <Input
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="0"
                min="0"
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-purple-500/60"
                data-testid="dapp-reward-input"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-white/60 text-sm">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the dapp..."
                maxLength={500}
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 resize-none h-24 focus:border-purple-500/60"
                data-testid="dapp-description-input"
              />
            </div>

            {/* Logo URL fallback */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-white/60 text-sm">Or paste logo URL (instead of upload)</Label>
              <Input
                value={logoUrl}
                onChange={(e) => { setLogoUrl(e.target.value); if (e.target.value) { setImageFile(null); setImagePreview(""); } }}
                placeholder="https://example.com/logo.png"
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-purple-500/60"
                data-testid="dapp-logourl-input"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-white/10">
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-[#8B3EFE] hover:bg-[#7b35e6] text-white gap-2 px-6 disabled:opacity-50"
              data-testid="dapp-create-button"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="w-4 h-4" /> Create Dapp</>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Edit form */}
      {editingId && (
        <Card className="w-full max-w-3xl bg-white/[0.04] border border-purple-500/30 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_40px_rgba(138,63,252,0.08)] mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Pencil className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Edit Dapp</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo upload */}
            <div className="space-y-3 md:col-span-2 flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-yellow-500/60 shadow-lg shadow-yellow-500/10 bg-purple-900/30 flex items-center justify-center">
                  {editDisplayPreview ? (
                    <img
                      src={editDisplayPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-white/30" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-[10px] text-white/80 font-medium">Change</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-white/40">Upload new logo (or change URL below)</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Dapp Name *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="My Dapp"
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-yellow-500/60"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Category</Label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/15 text-white rounded-md px-3 py-2 text-sm focus:border-yellow-500/60 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#1a1a2e] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Website URL *</Label>
              <Input
                value={editWebsiteUrl}
                onChange={(e) => setEditWebsiteUrl(e.target.value)}
                placeholder="https://mydapp.com"
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-yellow-500/60"
              />
            </div>

            {/* Reward */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">XP Reward</Label>
              <Input
                type="number"
                value={editReward}
                onChange={(e) => setEditReward(e.target.value)}
                placeholder="0"
                min="0"
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-yellow-500/60"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-white/60 text-sm">Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe the dapp..."
                maxLength={500}
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 resize-none h-24 focus:border-yellow-500/60"
              />
            </div>

            {/* Logo URL update */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-white/60 text-sm">Or update logo URL (leave empty to keep current)</Label>
              <Input
                value={editLogoUrl}
                onChange={(e) => { setEditLogoUrl(e.target.value); if (e.target.value) { setEditImageFile(null); setEditImagePreview(""); } }}
                placeholder="https://example.com/new-logo.png"
                className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-yellow-500/60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/10">
            <Button
              onClick={cancelEdit}
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
            >
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button
              onClick={() => handleUpdate(editingId)}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 text-black gap-2 px-6 disabled:opacity-50 font-medium"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Existing dapps list */}
      <div className="w-full max-w-3xl">
        <h3 className="text-lg font-semibold text-white mb-4">Listed Dapps</h3>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : dapps.length === 0 ? (
          <Card className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/50">No dapps listed yet. Add one above.</p>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="dapps-list">
            {dapps.map((dapp) => (
              <Card
                key={dapp._id}
                className={`bg-white/[0.04] border rounded-xl p-4 flex items-center gap-4 transition-colors ${
                  editingId === dapp._id
                    ? "border-yellow-500/40 bg-yellow-500/[0.03]"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-purple-900/30 flex items-center justify-center">
                  {brokenLogos.has(dapp._id) ? (
                    <ImageIcon className="w-5 h-5 text-white/30" />
                  ) : (
                    <img
                      src={dapp.logo}
                      alt={dapp.name}
                      className="w-full h-full object-cover"
                      onError={() => setBrokenLogos(prev => new Set(prev).add(dapp._id))}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{dapp.name}</span>
                    <Badge className="text-[10px] bg-purple-500/20 text-purple-300">{dapp.category}</Badge>
                    {dapp.reward > 0 && (
                      <Badge className="text-[10px] bg-green-500/20 text-green-400">+{dapp.reward} XP</Badge>
                    )}
                  </div>
                  <p className="text-white/50 text-xs truncate mt-0.5">{dapp.websiteUrl}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(dapp)}
                    disabled={editingId !== null}
                    className="text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-500/10"
                    data-testid={`dapp-edit-${dapp._id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(dapp.websiteUrl, "_blank")}
                    className="text-white/50 hover:text-white hover:bg-white/10"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(dapp)}
                    disabled={deleting === dapp._id}
                    className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                    data-testid={`dapp-delete-${dapp._id}`}
                  >
                    {deleting === dapp._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
