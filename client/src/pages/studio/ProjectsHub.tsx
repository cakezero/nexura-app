"use client";

import React, { useState } from "react";
import AnimatedBackground from "../../components/AnimatedBackground";
import { CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Globe, Twitter } from "lucide-react";
import { useLocation } from "wouter";

export default function ProjectsHub() {
  const [, setLocation] = useLocation();
  const [hubName, setHubName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [xAccount, setXAccount] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

const handleSubmit = () => {
  setLocation("/connect-discord");
};

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="max-w-xl mx-auto relative z-10 space-y-6 bg-white/[0.03] border border-[#A760FF] rounded-2xl p-6">

        <CardTitle className="text-lg">Create Project Hub</CardTitle>

        <div className="space-y-2">
          <CardTitle className="text-xs">Project Name</CardTitle>
          <Input
            value={hubName}
            onChange={(e) => setHubName(e.target.value)}
            placeholder="Enter your Project Name..."
            className="bg-gray-800 border-purple-500 text-white"
          />
        </div>

        <div className="space-y-2">
          <CardTitle className="text-xs">Description</CardTitle>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project (150–300 characters)"
            maxLength={300}
            className="bg-gray-800 border-purple-500 text-white h-32"
          />
        </div>

        <div className="space-y-3">
          <CardTitle className="text-xs">Project Links</CardTitle>

          <div className="relative">
            <Globe className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website"
              className="bg-gray-800 border-purple-500 text-white pl-10"
            />
          </div>

          <div className="relative">
            <Twitter className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={xAccount}
              onChange={(e) => setXAccount(e.target.value)}
              placeholder="X account"
              className="bg-gray-800 border-purple-500 text-white pl-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          <CardTitle className="text-xs text-center">Project Logo</CardTitle>

          <label className="w-full border-2 border-dashed border-purple-500 rounded-2xl p-8 bg-black cursor-pointer block">
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

            {imagePreview ? (
              <img src={imagePreview} className="w-32 h-32 mx-auto rounded-xl" />
            ) : (
              <p className="text-center text-white/60">Upload logo</p>
            )}
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#8B3EFE]"
        >
          {loading ? "Creating..." : "Create Project"}
        </Button>

      </div>
    </div>
  );
}