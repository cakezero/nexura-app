import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/auth";
import { uploadFile } from "../lib/upload";
import { getSessionToken, emitSessionChange } from "../lib/session";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, Save, Upload, X, Camera } from "lucide-react";
import { FaDiscord, FaTwitter } from "react-icons/fa";
import { Link, useLocation } from "wouter";
import { useToast } from "../hooks/use-toast";
import { apiRequestV2 } from "../lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import AnimatedBackground from "../components/AnimatedBackground";
import { discordAuthUrl } from "../lib/constants";
import { getAuthUrl } from "../lib/generateXAuthUrl";
import { useWallet } from "../hooks/use-wallet";
import { getTrustUsername } from "../services/tns";

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, connectWallet, address, disconnect } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  ////////////// TRUST NAME INTEGRATION
  const [activeUsernameMode, setActiveUsernameMode] = useState("custom");
  const [searchLoading, setSearchLoading] = useState(false);
  const [tnsName, setTnsName] = useState<string | null>(null);

const getFinalUsername = (name: string, mode: string) => {
  if (!name) return "";
  return mode === "trust" ? `${name}.trust` : name;
};

  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || user?.username || "User",
    username: user?.username || "",
    socialProfiles: {
      x: { connected: false, username: "" },
      discord: { connected: false, username: "" }
    },
    avatar: user?.profilePic
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || user.username || "User",
        username: user.username || "",
        socialProfiles: user.socialProfiles ?? {
          x: { connected: false, username: "" },
          discord: { connected: false, username: "" }
        },
        avatar: user?.profilePic
      });
    }
  }, [user]);

useEffect(() => {
  if (activeUsernameMode !== "trust") return;
  if (!address) return;

  const runLookup = async () => {
    setSearchLoading(true);

    console.log("ACTIVE MODE:", activeUsernameMode);
    console.log("ADDRESS:", address);

    const label = await getTrustUsername(address);

    console.log("TNS LABEL:", label);

    setSearchLoading(false);

    setTnsName(label);

    setProfileData((prev) => ({
      ...prev,
      username: label
        ? label.endsWith(".trust")
          ? label.replace(".trust", "")
          : label
        : ""
    }));
  };

  runLookup();
}, [activeUsernameMode, address]);

  const handleSave = async () => {
    try {
      let updateUser: FormData | Record<string, unknown>;

      const finalUsername = getFinalUsername(
        profileData.username,
        activeUsernameMode
      );

      if (profileData.avatar instanceof File) {
        const formData = new FormData();

        formData.append("username", finalUsername);
        formData.append("profilePic", profileData.avatar);
        formData.append(
          "socialProfiles",
          JSON.stringify(profileData.socialProfiles)
        );

        updateUser = formData;
      } else {
        updateUser = {
          username: finalUsername,
          socialProfiles: profileData.socialProfiles,
        };
      }

      await apiRequestV2("PATCH", "/api/user/update", updateUser);

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });

      setLocation("/profile");
      window.location.reload();
    } catch (e: any) {
      console.error("Profile update error:", e);
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));

    setProfileData((prev) => ({ ...prev, avatar: file }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setProfileData((prev) => ({ ...prev, avatar: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConnect = async (service: "x" | "discord") => {
    const urls = {
      x: "",
      discord: discordAuthUrl
    };

    if (service === "x") {
      const authUrl = await getAuthUrl();
      urls.x = authUrl;
    }

    toast({
      title: `Connecting to ${service}`,
      description: `Opening ${service} authentication...`
    });

    window.location.assign(urls[service]);
  };

  const handleDisconnect = async (service: "x" | "discord") => {
    try {
      if (service === "x") {
        await apiRequestV2("GET", "/api/auth/x/logout");
      } else {
        await apiRequestV2("GET", "/api/auth/discord/logout");
      }

      setProfileData((prev) => ({
        ...prev,
        socialProfiles: {
          ...prev.socialProfiles,
          [service]: { connected: false, username: "" }
        }
      }));

      toast({
        title: `Disconnected from ${service}`,
        description: `Your ${service} account has been disconnected.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 relative">
      <AnimatedBackground />

      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Edit Profile
            </h1>
          </div>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="username">Username</Label>

                <div className="flex items-center border border-white/10 rounded-md bg-white/5 p-1">
                  {["trust", "custom"].map((mode) => (
                    <button
                      key={mode}
                      className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                        activeUsernameMode === mode
                          ? "bg-purple-600 text-white shadow-[0_0_8px_rgba(138,63,252,0.6)]"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                      onClick={() => {
  setActiveUsernameMode(mode);
}}
                    >
                      {mode === "trust" ? ".trust" : "custom"}
                    </button>
                  ))}
                </div>
              </div>

              {activeUsernameMode === "trust" ? (
  <div className="relative">
    <Input
      id="username"
      value={profileData.username}
      disabled
      onChange={(e) =>
        setProfileData((prev) => ({
          ...prev,
          username: e.target.value
        }))
      }
    />

    {searchLoading && (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 bg-black/20 rounded-md">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          Searching...
        </div>
      </div>
    )}
    
    {!searchLoading && (
  <div className="mt-2 flex items-center justify-between gap-3">
    {tnsName ? (
      <>
        {/* LEFT: detected badge */}
        <div
          className="flex items-center gap-2 px-2 py-1 rounded-md border"
          style={{
            backgroundColor: "#10B98133",
            borderColor: "#10B9814D",
            color: "#10B981",
          }}
        >
          <span className="text-xs font-medium tracking-wide">
            TRUST NAME DETECTED
          </span>
        </div>

        {/* RIGHT: verified + message */}
        <div className="flex items-center gap-2 text-sm text-green-500">
          <img
            src="/verified.png"
            alt="verified"
            className="w-4 h-4"
          />
          <span className="text-xs sm:text-sm">
            Verified — This username is linked to your wallet
          </span>
        </div>
      </>
    ) : (
      <p className="text-xs text-red-400">
        Oops, no .trust username was found for this address. If you want one, you can get your .trust username through{" "}
        <a
          href="https://tns.intuition.box"
          className="text-purple-400 underline hover:text-purple-300"
        >
          TNS
        </a>
      </p>
    )}
  </div>
)}
  </div>
) : (
  <Input
    id="username"
    value={profileData.username}
    onChange={(e) =>
      setProfileData((prev) => ({
        ...prev,
        username: e.target.value
      }))
    }
  />
)}
            </div>

            <Separator className="my-6" />

            {/* Avatar Upload Section */}
            <div className="space-y-3">
              <Label>Profile Picture</Label>

              <div className="flex items-start gap-6">
                {/* Current Avatar Preview */}
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-border">
                    <AvatarImage src={avatarPreview || user?.profilePic || ""} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      {(profileData.displayName || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {avatarPreview && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                      title="Remove avatar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Upload Area */}
                <div className="flex-1">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
                      ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }
                    `}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {isDragging ? 'Drop your image here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Profiles */}
        <Card>
          <CardHeader>
            <CardTitle>Social Profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Twitter/X */}
            <div className="flex items-center justify-between" data-testid="x-connection">
              <div className="flex items-center space-x-3">
                <FaTwitter className="w-6 h-6 text-[#1DA1F2]" />
                <div>
                  <p className="font-medium">X (Formerly Twitter)</p>
                  {profileData.socialProfiles.x.connected ? (
                    <p className="text-sm text-muted-foreground">@{profileData.socialProfiles.x.username}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
              {profileData.socialProfiles.x.connected ? (
                <Button
                  variant="outline"
                  onClick={() => handleDisconnect("x")}
                  data-testid="button-disconnect-x"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={() => handleConnect("x")}
                  data-testid="button-connect-x"
                >
                  Connect
                </Button>
              )}
            </div>

            <Separator />

            {/* Discord */}
            <div className="flex items-center justify-between" data-testid="discord-connection">
              <div className="flex items-center space-x-3">
                <FaDiscord className="w-6 h-6 text-[#5865F2]" />
                <div>
                  <p className="font-medium">Discord</p>
                  {profileData.socialProfiles.discord.connected ? (
                    <p className="text-sm text-muted-foreground">@{profileData.socialProfiles.discord.username}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
              {profileData.socialProfiles.discord.connected ? (
                <Button
                  variant="outline"
                  onClick={() => handleDisconnect("discord")}
                  data-testid="button-disconnect-discord"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={() => handleConnect("discord")}
                  data-testid="button-connect-discord"
                >
                  Connect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}