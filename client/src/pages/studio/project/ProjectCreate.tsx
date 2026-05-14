"use client";

import React, { useState, useMemo, useEffect } from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { useLocation } from "wouter";
import { projectApiRequest, storeProjectSession, base64ToBlob } from "../../../lib/projectApi";
import { apiRequestV2 } from "../../../lib/queryClient";
import OTPModal from "../../../components/studio/OTPModal";
import { useToast } from "../../../hooks/use-toast";
import { useWallet } from "../../../hooks/use-wallet";
import { Eye, EyeOff, Info, ArrowRight, Globe, Twitter, Upload } from "lucide-react";

export default function ProjectCreate() {
  const { address: walletAddress } = useWallet();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Step 1: Credentials
  const [name, setName] = useState("");
  const emailFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") ?? "";
  }, []);
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-fill wallet address when connected
  useEffect(() => {
    if (walletAddress && !address) {
      setAddress(walletAddress);
    }
  }, [walletAddress]);

  // Step 2: Project Details
  const [hubName, setHubName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [xAccount, setXAccount] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);

  const pwdChecks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    upper: /[A-Z]/.test(password),
  };
  const allPwdValid = Object.values(pwdChecks).every(Boolean);

  const canGoToStep2 = allPwdValid && !!name && !!email && password === confirmPassword && !loading;
  const canSubmit = !!hubName && description.length >= 150 && description.length <= 300 && !!imageFile && !loading;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageFile(file);
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  async function handleSignUp() {
    if (!name || !email || !password || !hubName || !description || !imageFile) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Send OTP
      await apiRequestV2("POST", `/api/hub-auth/validate-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&page=project`);

      sessionStorage.setItem("nexura:pending-signup", JSON.stringify({
        email,
        password,
        name,
        page: "project",
        hubDetails: {
          hubName: hubName.trim(),
          description,
          website: website.trim(),
          xAccount: xAccount.trim(),
          imagePreview
        }
      }));

      setIsOTPModalOpen(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Creation failed. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center p-4 font-['Geist',sans-serif]">
      <AnimatedBackground />

      <div className={`relative z-10 w-full max-w-[869px] bg-[rgba(139,62,254,0.1)] rounded-[32px] py-12 px-6 sm:px-16 flex flex-col items-center transition-all duration-300 ${step === 2 ? "scale-[0.85] -mt-8" : "scale-[0.8] -mt-16 sm:-mt-24"}`}>
        
        {/* Header */}
        <h1 className="text-[30px] font-semibold text-white mb-2 text-center">
          {step === 1 ? "Shared Access Credentials" : "Project Details"}
        </h1>
        <p className="text-[15px] font-medium text-[rgba(255,255,255,0.6)] mb-10 text-center max-w-md">
          {step === 1 
            ? "Set up credentials that will allow your team members to access your project on Nexura Studio." 
            : "Set up a dedicated project space for your project or community on Nexura."}
        </p>

        <form onSubmit={(e) => { e.preventDefault(); step === 1 ? setStep(2) : handleSignUp(); }} className="w-full max-w-[740px] space-y-6">
          
          {step === 1 && (
            <>
              {/* Super Admin Name */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold text-white">Super Admin Name</label>
                <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter super admin name..."
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex justify-center pt-2 pb-2">
                <div className="bg-[rgba(201,170,255,0.2)] max-w-[740px] w-full py-3 px-4 sm:px-6 rounded-2xl flex items-start gap-3 border border-purple-500/20">
                  <Info className="w-[15px] h-[15px] text-[#8b3efe] shrink-0 mt-1" />
                  <p className="text-[14px] font-semibold leading-[23px]">
                    <span className="text-white">Disclaimer:</span>
                    <span className="text-[#a3adc2]"> Anyone with these credentials can manage your campaign and project settings.</span>
                  </p>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold text-white">Email Address</label>
                <div className={`bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden ${emailFromUrl ? "opacity-60" : ""}`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address..."
                    readOnly={!!emailFromUrl}
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>

              {/* Project Wallet Address */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold text-white">Project Wallet Address</label>
                <div className={`bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden ${walletAddress ? "opacity-70" : ""}`}>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x..."
                    readOnly={!!walletAddress}
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)] font-mono"
                  />
                </div>
                {walletAddress && (
                  <p className="text-xs text-white/40 ml-1">Auto-filled from connected wallet</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold text-white">Password</label>
                <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)] tracking-widest font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password checklist */}
                <div className="flex flex-col gap-1 mt-2 text-[11px] ml-1">
                  <div className={`flex items-center gap-2 ${pwdChecks.length ? "text-emerald-400" : "text-white/40"}`}>
                    <div className={`w-1 h-1 rounded-full ${pwdChecks.length ? "bg-emerald-400" : "bg-white/40"}`} />
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pwdChecks.upper ? "text-emerald-400" : "text-white/40"}`}>
                    <div className={`w-1 h-1 rounded-full ${pwdChecks.upper ? "bg-emerald-400" : "bg-white/40"}`} />
                    <span>At least 1 uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pwdChecks.number ? "text-emerald-400" : "text-white/40"}`}>
                    <div className={`w-1 h-1 rounded-full ${pwdChecks.number ? "bg-emerald-400" : "bg-white/40"}`} />
                    <span>At least 1 number</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pwdChecks.special ? "text-emerald-400" : "text-white/40"}`}>
                    <div className={`w-1 h-1 rounded-full ${pwdChecks.special ? "bg-emerald-400" : "bg-white/40"}`} />
                    <span>At least 1 special character</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold text-white">Confirm Password</label>
                <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)] tracking-widest font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-[11px] ml-1 mt-1">Passwords do not match</p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Project Name */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold text-white">Project Name</label>
                <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden">
                  <input
                    type="text"
                    value={hubName}
                    onChange={(e) => setHubName(e.target.value.toUpperCase())}
                    placeholder="Enter your Project Name..."
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[18px] font-bold text-white">Description</label>
                  <span className={`text-[11px] ${description.length > 0 && description.length < 150 ? "text-red-400" : "text-white/40"}`}>
                    {description.length}/300
                  </span>
                </div>
                <div className="bg-[#060210] border border-[#8a3efe] rounded-2xl px-4 py-2 flex flex-col overflow-hidden">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project or community (150-300 characters)"
                    maxLength={300}
                    rows={4}
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)] resize-none"
                  />
                </div>
                {description.length > 0 && description.length < 150 && (
                  <p className="text-[11px] text-red-400 ml-1">
                    Minimum 150 characters – {150 - description.length} more needed
                  </p>
                )}
              </div>

              {/* Project Links */}
              <div className="space-y-3">
                <label className="block text-[18px] font-bold text-white">Project Links (Optional)</label>
                <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center gap-3 overflow-hidden">
                  <Globe className="w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Project website (e.g. https://example.com)"
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)]"
                  />
                </div>
                <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center gap-3 overflow-hidden">
                  <Twitter className="w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={xAccount}
                    onChange={(e) => setXAccount(e.target.value)}
                    placeholder="X account (e.g. @myproject)"
                    className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>

              {/* Project Logo Upload */}
              <div className="space-y-3">
                <label className="block text-[18px] font-bold text-white text-center">Project Logo</label>
                <label className="w-full border-2 border-dashed border-[#8a3efe] rounded-2xl p-6 bg-[#060210] hover:bg-[#8a3efe]/10 transition-all cursor-pointer block group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-xl border border-purple-500"
                      />
                      <p className="text-[12px] text-white/60 group-hover:text-white transition-colors">Click to change logo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                      <Upload className="w-10 h-10 text-purple-400" />
                      <p className="text-[14px] font-medium text-white">Click to upload or drag and drop</p>
                      <p className="text-[12px] text-white/40">SVG, PNG, JPG or GIF (max. 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            {step === 1 ? (
              <button
                type="submit"
                disabled={!canGoToStep2}
                className="w-full h-[50px] rounded-full bg-[#8b3efe] shadow-[0px_2px_3px_#843afd,0px_1px_1px_#843afd] flex items-center justify-center gap-2 text-[18px] font-bold text-white hover:bg-[#9b51ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-[50px] rounded-full bg-[#8b3efe] shadow-[0px_2px_3px_#843afd,0px_1px_1px_#843afd] flex items-center justify-center gap-2 text-[18px] font-bold text-white hover:bg-[#9b51ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Create Project <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-[14px] text-white/40 hover:text-white transition-colors"
                >
                  Back to Credentials
                </button>
              </div>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={() => setLocation("/projects/create/signin-to-hub")}
                className="w-full h-[60px] rounded-full border border-[#833bfb] shadow-[0px_1px_1px_#843afd] flex items-center justify-center gap-2 text-[20px] font-bold text-white hover:bg-[rgba(131,59,251,0.1)] transition-all"
              >
                Sign In <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      <OTPModal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        email={email}
        page="project"
      />
    </div>
  );
}
