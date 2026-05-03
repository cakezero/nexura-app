"use client";

import React, { useState } from "react";
import AnimatedBackground from "../../components/AnimatedBackground";
import { CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useLocation } from "wouter";
import { storeUserSession } from "../../lib/userSession";

export default function UsersHub() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [, setLocation] = useLocation();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!username.trim()) {
      alert("Please enter a username.");
      return;
    }

    const userSession = {
      type: "user",
      role: "user",
      sessionId: crypto.randomUUID(),
      username: username.trim(),
      bio: bio || "",
      avatar: imagePreview || "",
    };

    storeUserSession(userSession);

    setLocation("/user-dashboard/user-profile");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="max-w-xl mx-auto relative z-10 space-y-6 bg-white/[0.03] border border-[#A760FF] rounded-2xl p-6">

        <CardTitle className="text-lg">Create User Profile</CardTitle>

        <div className="space-y-2">
          <CardTitle className="text-xs">Username</CardTitle>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name..."
            className="bg-gray-800 border-purple-500 text-white"
          />
        </div>

        <div className="space-y-2">
          <CardTitle className="text-xs">Short bio</CardTitle>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            className="bg-gray-800 border-purple-500 text-white h-24"
          />
        </div>

        <div className="space-y-3">
          <CardTitle className="text-xs text-center">Avatar</CardTitle>

          <label className="w-full border-2 border-dashed border-purple-500 rounded-2xl p-8 bg-black cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 mx-auto rounded-xl object-cover"
              />
            ) : (
              <p className="text-center text-white/60">Upload avatar</p>
            )}
          </label>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-[#8B3EFE] py-3 rounded-xl hover:opacity-90 transition"
        >
          Save and Continue
        </button>

      </div>
    </div>
  );
}