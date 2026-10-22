"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import AuthShell, { type StepState } from "./AuthShell";
import {
  Card, CardText, CardTitle, CodeInput, ErrorText, Field, GoogleAuthenticatorRow, PasswordInput, PrimaryButton,
  StrengthBar, TextInput, TextLink, WalletBanner, errorMessage, passwordOk,
} from "./AuthUI";
import { useStudioWallet } from "../useStudioWallet";
import { projectApiRequest, storeProjectSession } from "@/lib/projectApi";
import { useToast } from "@/hooks/use-toast";

type Step = "signin" | "twofa" | "reset-email" | "reset-code" | "reset-password" | "reset-done";

type Admin = { _id: string; name: string; email: string; role: string; hub?: string };
type WalletProof = { address: string; message: string; signature: string; at: number };
// The server accepts a login signature for 10 minutes; sign again a little before that
const PROOF_TTL_MS = 9 * 60 * 1000;
const SIGN_TIMEOUT_MS = 90 * 1000;

type SignInResponse = {
  accessToken?: string; token?: string; admin?: Admin;
  twoFactorRequired?: boolean; twoFactorToken?: string;
};

const SIGN_IN_STEPS: [StepState, StepState, StepState] = ["active", "todo", "todo"];
const RESET_STEPS: [StepState, StepState, StepState] = ["done", "todo", "todo"];
const RESEND_SECONDS = 60;

export default function SignInFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { connect } = useStudioWallet();
  const { address: liveAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const address = isConnected && liveAddress ? liveAddress : null;
  const [step, setStep] = useState<Step>(params.get("reset") ? "reset-email" : "signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [proof, setProof] = useState<WalletProof | null>(null);
  const [signing, setSigning] = useState(false);
  const [walletError, setWalletError] = useState("");
  const signingFor = useRef<string | null>(null);

  // Signs the login message as soon as a wallet connects, so Sign in itself never opens the wallet
  const signWallet = useCallback(async (addr: string): Promise<WalletProof | null> => {
    if (signingFor.current === addr) return null;
    signingFor.current = addr;
    setSigning(true); setWalletError("");
    const message = `Nexura Wallet Login
Address: ${addr}
Nonce: ${Date.now()}`;
    try {
      const signature = await Promise.race([
        signMessageAsync({ message }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), SIGN_TIMEOUT_MS)),
      ]);
      const next = { address: addr, message, signature, at: Date.now() };
      setProof(next);
      return next;
    } catch (err) {
      setWalletError((err as Error)?.message === "timeout"
        ? "Your wallet didn't respond. Open it and try Sign again."
        : "Sign the message in your wallet to verify it.");
      return null;
    } finally {
      signingFor.current = null;
      setSigning(false);
    }
  }, [signMessageAsync]);

  useEffect(() => {
    if (!address) { setProof(null); setWalletError(""); return; }
    if (proof?.address !== address) { setProof(null); void signWallet(address); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const verified = !!proof && proof.address === address && Date.now() - proof.at < PROOF_TTL_MS;

  useEffect(() => {
    try {
      const reason = sessionStorage.getItem("nexura:signed-out-reason");
      if (!reason) return;
      sessionStorage.removeItem("nexura:signed-out-reason");
      toast({ title: "You were signed out", description: reason });
    } catch { /* storage unavailable */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const go = (s: Step) => { setError(""); setStep(s); };

  const finishSignIn = async (res: SignInResponse, email: string) => {
    const token = res.token ?? res.accessToken;
    if (!token) throw new Error("Signing in didn't return a session. Try again.");
    const base = { email: res.admin?.email ?? email, role: res.admin?.role ?? "admin", adminId: res.admin?._id ?? "" };
    storeProjectSession(token, { ...base, name: res.admin?.name ?? email });
    try {
      const { hub } = await projectApiRequest<{ hub: Record<string, any> }>({ method: "GET", endpoint: "/hub/me" });
      storeProjectSession(token, { ...base, name: hub.name ?? res.admin?.name ?? email, logo: hub.logo ?? "" });
    } catch { /* keep the basic session if the hub can't be loaded */ }
    router.push("/studio-dashboard/hub-profile");
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = identifier.trim();
    if (!email || !password) return setError("Enter your username or email and your password.");
    if (!address) { setWalletError("Connect your wallet first."); connect(); return; }
    if (signing) return setWalletError("Approve the signature in your wallet first.");
    const current = verified ? proof : await signWallet(address);
    if (!current) return;
    setBusy(true); setError(""); setWalletError("");
    try {
      const { message, signature } = current;
      const res = await projectApiRequest<SignInResponse>({
        method: "POST", endpoint: "/hub/sign-in",
        data: { email, password, role: "project", walletAddress: address, message, signature },
      });
      if (res.twoFactorRequired && res.twoFactorToken) {
        setTwoFactorToken(res.twoFactorToken);
        setTotp("");
        go("twofa");
        return;
      }
      await finishSignIn(res, email);
    } catch (err) {
      const msg = errorMessage(err, "Those details didn't match an account.");
      // A wrong wallet is rejected before the signature is used, so it stays valid; otherwise sign again next time
      if (/you connected|switch to the wallet|linked to this studio/i.test(msg)) setWalletError(msg);
      else { setProof(null); setError(msg); }
    } finally { setBusy(false); }
  };

  const verifyTwoFactor = async (value = totp) => {
    if (value.length !== 6) return setError("Enter the 6-digit code from Google Authenticator.");
    setBusy(true); setError("");
    try {
      const res = await projectApiRequest<SignInResponse>({
        method: "POST", endpoint: "/hub/2fa/verify-login", data: { twoFactorToken, code: value },
      });
      await finishSignIn(res, identifier.trim());
    } catch (err) {
      setTotp("");
      setError(errorMessage(err, "That code didn't work. Wait for a new one and try again."));
    } finally { setBusy(false); }
  };

  const sendResetCode = async () => {
    await projectApiRequest({ method: "POST", endpoint: "/hub/forgot-password", data: { email: resetEmail.trim().toLowerCase(), page: "project" } });
    setResendIn(RESEND_SECONDS);
  };

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(resetEmail.trim())) return setError("Enter the email on your account.");
    setBusy(true); setError("");
    try { await sendResetCode(); setResetCode(""); go("reset-code"); }
    catch (err) { setError(errorMessage(err, "We couldn't send the code. Try again.")); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    setBusy(true); setError("");
    try { await sendResetCode(); setResetCode(""); }
    catch (err) { setError(errorMessage(err, "We couldn't resend the code.")); }
    finally { setBusy(false); }
  };

  const confirmCode = (value = resetCode) => {
    if (value.length !== 6) return setError("Enter the 6-digit code from your email.");
    go("reset-password");
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordOk(newPassword)) return setError("Use at least 8 characters with a number, a capital letter and a symbol.");
    if (newPassword !== confirm) return setError("The two passwords don't match.");
    setBusy(true); setError("");
    try {
      await projectApiRequest({
        method: "POST", endpoint: "/hub/reset-password",
        data: { email: resetEmail.trim().toLowerCase(), code: resetCode, password: newPassword },
      });
      setNewPassword(""); setConfirm(""); setResetCode("");
      go("reset-done");
    } catch (err) {
      const msg = errorMessage(err, "We couldn't update your password.");
      if (/code|otp|expired/i.test(msg)) { setResetCode(""); setStep("reset-code"); }
      setError(msg);
    } finally { setBusy(false); }
  };

  const back = () => {
    if (step === "signin") return router.push("/studio");
    if (step === "reset-code") return go("reset-email");
    if (step === "reset-password") return go("reset-code");
    go("signin");
  };

  const isReset = step.startsWith("reset");

  return (
    <AuthShell steps={isReset ? RESET_STEPS : SIGN_IN_STEPS} onBack={back} account="signup">
      {step === "signin" && (
        <form onSubmit={signIn} noValidate className="flex w-full justify-center pt-[20px] lg:pt-[18px]">
          <Card shadow="soft">
            <WalletBanner address={address} onConnect={connect} verified={verified} signing={signing} onSign={() => address && signWallet(address)} />
            <ErrorText>{walletError}</ErrorText>
            <div className="pt-[14px]"><CardTitle>Sign in</CardTitle></div>
            <CardText>Enter your account details to open your studio.</CardText>
            <Field label="Username or email" className="pt-[16px]">
              <TextInput value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" placeholder="you@project.xyz" />
            </Field>
            <Field label="Password">
              <PasswordInput withShow value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" />
            </Field>
            <div className="flex w-full justify-end pb-[12px] pt-[8px]">
              <TextLink onClick={() => { setResetEmail(identifier.includes("@") ? identifier.trim() : ""); go("reset-email"); }}>Forgot password?</TextLink>
            </div>
            <PrimaryButton type="submit" disabled={busy || signing}>{busy ? "Signing in…" : "Sign in"}</PrimaryButton>
            <ErrorText>{error}</ErrorText>
            <p className="w-full pt-[14px] text-center text-[13.5px] leading-[20.925px] text-[#5b6478]">
              New to Nexura Studio? <a href="/studio/sign-up" className="font-semibold text-[#8a3ffc]">Create account</a>
            </p>
          </Card>
        </form>
      )}

      {step === "twofa" && (
        <form onSubmit={e => { e.preventDefault(); verifyTwoFactor(); }} className="flex w-full justify-center pt-[24px] lg:pt-[48px]">
          <Card>
            <div className="pt-[20px]"><CardTitle>Two-step verification</CardTitle></div>
            <CardText>Open Google Authenticator and enter the 6-digit code for Nexura Studio.</CardText>
            <div className="w-full pt-[24px]"><GoogleAuthenticatorRow /></div>
            <CodeInput value={totp} onChange={setTotp} onComplete={v => verifyTwoFactor(v)} className="pt-[18px]" />
            <PrimaryButton type="submit" disabled={busy} className="mt-[20px]">{busy ? "Checking…" : "Verify and sign in"}</PrimaryButton>
            <ErrorText>{error}</ErrorText>
            <div className="flex w-full justify-center pt-[18px]"><TextLink onClick={() => go("signin")}>Back to sign in</TextLink></div>
          </Card>
        </form>
      )}

      {step === "reset-email" && (
        <form onSubmit={requestReset} noValidate className="flex w-full justify-center pt-[24px] lg:pt-[56px]">
          <Card>
            <CardTitle>Reset your password</CardTitle>
            <CardText>Enter the email on your account and we will send a code.</CardText>
            <Field label="Email" className="pb-[16px] pt-[24px]">
              <TextInput round="soft" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@project.xyz" autoComplete="email" />
            </Field>
            <PrimaryButton type="submit" disabled={busy}>{busy ? "Sending…" : "Send code"}</PrimaryButton>
            <ErrorText>{error}</ErrorText>
          </Card>
        </form>
      )}

      {step === "reset-code" && (
        <form onSubmit={e => { e.preventDefault(); confirmCode(); }} className="flex w-full justify-center pt-[24px] lg:pt-[56px]">
          <Card>
            <CardTitle>Check your email</CardTitle>
            <CardText>We sent a 6-digit code to {resetEmail.trim().toLowerCase()}.</CardText>
            <CodeInput value={resetCode} onChange={setResetCode} onComplete={v => confirmCode(v)} />
            <PrimaryButton type="submit" className="mt-[20px]">Verify</PrimaryButton>
            <ErrorText>{error}</ErrorText>
            <div className="flex w-full justify-center pt-[18px] text-[13.5px] leading-[20.925px] text-[#5b6478]">
              {resendIn > 0 ? `Resend code in ${resendIn}s` : <TextLink onClick={resend} disabled={busy}>Resend code</TextLink>}
            </div>
          </Card>
        </form>
      )}

      {step === "reset-password" && (
        <form onSubmit={updatePassword} noValidate className="flex w-full justify-center pt-[24px] lg:pt-[48px]">
          <Card>
            <CardTitle>Choose a new password</CardTitle>
            <CardText>Pick something you have not used before.</CardText>
            <Field label="Password" className="pt-[24px]">
              <PasswordInput round="soft" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              <StrengthBar password={newPassword} />
            </Field>
            <Field label="Confirm password" className="py-[16px]">
              <PasswordInput round="soft" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
            </Field>
            <PrimaryButton type="submit" disabled={busy} className="mt-[10px]">{busy ? "Updating…" : "Update password"}</PrimaryButton>
            <ErrorText>{error}</ErrorText>
          </Card>
        </form>
      )}

      {step === "reset-done" && (
        <div className="flex w-full justify-center pt-[24px] lg:pt-[64px]">
          <Card shadow="softer">
            <CardTitle>Password updated</CardTitle>
            <CardText className="pb-[24px]">You can sign in with your new password.</CardText>
            <PrimaryButton type="button" onClick={() => { setPassword(""); setIdentifier(resetEmail.trim()); go("signin"); }}>Back to sign in</PrimaryButton>
          </Card>
        </div>
      )}
    </AuthShell>
  );
}
