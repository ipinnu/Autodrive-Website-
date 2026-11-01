"use client";

import { useEffect, useRef, useState } from "react";
import { createUserWithEmailAndPassword, deleteUser, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { Building2, CheckCircle2, MailCheck, UserRound } from "lucide-react";
import { useCustomer } from "./CustomerProvider";
import { client, errorMessage, registrationAgent, registrationData, track, validateDetails } from "@/lib/customer";

export function AccountTypeChoice() {
  const { accountType, chooseAccountType } = useCustomer();
  return <fieldset><legend className="customer-small font-bold">Who are you renewing for?</legend><div className="customer-radio-grid">
    <button type="button" aria-pressed={accountType === "personal"} onClick={() => chooseAccountType("personal")}><UserRound size={19} />Personal</button>
    <button type="button" aria-pressed={accountType === "organization"} onClick={() => chooseAccountType("organization")}><Building2 size={19} />Organization</button>
  </div></fieldset>;
}
function GoogleMark() { return <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M44 24.5c0-1.5-.1-3-.4-4.5H24v8.5h11.2a9.5 9.5 0 0 1-4.2 6.3v5.3h6.8C41.8 36.5 44 31.1 44 24.5Z"/><path fill="#34A853" d="M24 45c5.6 0 10.3-1.9 13.8-5.1L31 34.6c-1.9 1.3-4.2 2-7 2-5.4 0-10-3.6-11.6-8.5h-7v5.5A21 21 0 0 0 24 45Z"/><path fill="#FBBC05" d="M12.4 28.1a12.6 12.6 0 0 1 0-8.2v-5.5h-7a21 21 0 0 0 0 19.2l7-5.5Z"/><path fill="#EA4335" d="M24 11.4c3 0 5.7 1 7.8 3.1l5.9-5.9A20 20 0 0 0 24 3 21 21 0 0 0 5.4 14.4l7 5.5c1.6-4.9 6.2-8.5 11.6-8.5Z"/></svg>; }
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  return <button type="button" className="customer-google" disabled={busy} onClick={async () => {
    if (busy) return; setBusy(true); onError("");
    try { await signInWithPopup(client().auth, new GoogleAuthProvider()); void track("cta_tapped", { screenName: "web_signup", ctaLabel: "Sign in with Google" }); }
    catch (e) { onError(errorMessage(e)); } finally { setBusy(false); }
  }}><GoogleMark />{busy ? "Connecting…" : "Continue with Google"}</button>;
}

export function CustomerWelcome() {
  const [error, setError] = useState("");
  return <div className="customer-welcome"><div>
    <span className="customer-eyebrow">Your papers. Your peace of mind.</span><h1>Stay ready for<br />the road ahead.</h1>
    <p>Add your vehicle, keep an eye on your documents and renew your papers with AutoDrive. Your account works on the website and the app.</p>
    <AccountTypeChoice /><div className="customer-actions"><Link className="customer-primary" href="/renew/sign-up">Create account</Link><Link className="customer-secondary" href="/renew/sign-in">Sign in</Link></div>
    <div className="customer-divider">or connect with</div><GoogleButton onError={setError} />
    {error && <div className="customer-error" role="alert">{error}</div>}
    <p className="customer-small mt-5"><CheckCircle2 className="inline mr-1" size={15} />Personal vehicles and organizations. One simple start.</p>
  </div><div className="customer-welcome-art"><Image src="/images/customer/jeepintro.jpg" alt="Your AutoDrive garage" width={420} height={420} priority /></div></div>;
}

export function CustomerSignUp() {
  const { user, profile, accountType } = useCustomer();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [referral, setReferral] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [showPassword, setShowPassword] = useState(false);
  useEffect(() => { if (user) { setName((v) => v || user.displayName || ""); setEmail(user.email || ""); } }, [user]);
  const isCompleting = Boolean(user);
  return <div className="customer-card customer-narrow">
    <Link className="customer-link customer-small" href="/renew/welcome">← Back</Link>
    <h1>{isCompleting ? "Complete your account" : "Create account"}</h1><p>Set up your AutoDrive account, then we’ll help you build your garage.</p>
    {profile?.accountType ? <p className="customer-small">{profile.accountType === "organization" ? "Organization account" : "Personal account"}</p> : <AccountTypeChoice />}
    <form onSubmit={async (event) => {
      event.preventDefault(); if (busy) return; setBusy(true); setError("");
      let created: Awaited<ReturnType<typeof createUserWithEmailAndPassword>> | null = null;
      try {
        validateDetails(name, phone, isCompleting ? undefined : password, isCompleting ? undefined : confirm);
        const configured = client();
        const account = user || (created = await createUserWithEmailAndPassword(configured.auth, email.trim(), password.trim())).user;
        const agentId = profile?.agentId || await registrationAgent(referral);
        const data = registrationData({ uid: account.uid, fullName: name, email: account.email || email, phone, agentId, accountType });
        await setDoc(doc(configured.db, "users", account.uid), profile ? {
          firstName: data.firstName, lastName: data.lastName, fullName: data.fullName,
          email: data.email, phone: data.phone, phoneNumber: data.phoneNumber,
          ...(!profile.agentId ? { agentId } : {}), ...(!profile.accountType ? { accountType } : {}),
        } : data, { merge: Boolean(profile) });
        void track("cta_tapped", { screenName: "RegistrationScreen", ctaLabel: "Create account", accountType });
        // The auth/profile guard opens verification, then the same car-onboarding stages.
      } catch (e) {
        if (created) { try { await deleteUser(created.user); } catch { /* Keep incomplete accounts recoverable through this form. */ } }
        const message = errorMessage(e); setError(message); void track("error_shown", { screenName: "RegistrationScreen", errorMessage: message, errorCode: "signup_failed" });
      } finally { setBusy(false); }
    }}>
      <section className="customer-section"><h3>Your details</h3>
        <label className="customer-field"><span>Full name</span><input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" /></label>
        <label className="customer-field"><span>Email</span><input required type="email" autoComplete="email" disabled={isCompleting} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label className="customer-field"><span>Phone number</span><input required type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0801 234 5678" /></label>
      </section>
      {!isCompleting && <section className="customer-section"><h3>Account security</h3>
        <label className="customer-field"><span>Password</span><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <p className="customer-small">At least 8 characters, one number and one special character.</p>
        <label className="customer-field"><span>Confirm password</span><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        <label className="flex items-center gap-2 customer-small"><input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />Show passwords</label>
      </section>}
      <section className="customer-section"><label className="customer-field"><span>Agent referral code <span className="customer-muted">(optional)</span></span><input value={referral} onChange={(e) => setReferral(e.target.value)} placeholder="Leave blank to use AutoDrive’s assigned agent" /></label></section>
      {error && <div role="alert" className="customer-error">{error}</div>}
      <button type="submit" disabled={busy} className="customer-primary customer-full">{busy ? "Saving your account…" : isCompleting ? "Save and continue" : "Create account"}</button>
    </form>
    {!isCompleting && <><div className="customer-divider">or</div><GoogleButton onError={setError} /><p className="customer-small text-center mt-5">Already have an account? <Link className="customer-link" href="/renew/sign-in">Sign in</Link></p></>}
  </div>;
}

export function CustomerSignIn() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  return <div className="customer-card customer-narrow"><Link className="customer-link customer-small" href="/renew/welcome">← Back</Link>
    <h1>Welcome back</h1><p>Sign in with the same account you use in the AutoDrive app.</p>
    <form onSubmit={async (e) => { e.preventDefault(); if (busy) return; setBusy(true); setError("");
      try { await signInWithEmailAndPassword(client().auth, email.trim(), password.trim()); void track("cta_tapped", { screenName: "Loginscreen", ctaLabel: "Sign in" }); }
      catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
    }}>
      <label className="customer-field"><span>Email</span><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="customer-field"><span>Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button type="button" className="customer-link customer-small mb-5" disabled={busy} onClick={async () => {
        setError(""); setNotice(""); if (!email.trim()) { setError("Enter your email first."); return; }
        setBusy(true); try { await sendPasswordResetEmail(client().auth, email.trim()); setNotice("If an account uses this email, you’ll receive a password reset link."); }
        catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
      }}>Forgot password?</button>
      {error && <div className="customer-error" role="alert">{error}</div>}{notice && <div className="customer-notice" role="status">{notice}</div>}
      <button disabled={busy} className="customer-primary customer-full" type="submit">{busy ? "Please wait…" : "Sign in"}</button>
    </form><div className="customer-divider">or</div><GoogleButton onError={setError} />
    <p className="customer-small text-center mt-5">New to AutoDrive? <Link className="customer-link" href="/renew/sign-up">Create account</Link></p>
  </div>;
}

const verificationSends = new Map<string, Promise<void>>();
async function sendVerificationOnce(uid: string, force = false) {
  const key = `autodrive-verification-${uid}`;
  if (!force && Date.now() - Number(sessionStorage.getItem(key) || 0) < 60000) return;
  if (verificationSends.has(uid)) return verificationSends.get(uid)!;
  const pending = sendEmailVerification(client().auth.currentUser!).then(() => {
    sessionStorage.setItem(key, String(Date.now()));
  }).finally(() => verificationSends.delete(uid));
  verificationSends.set(uid, pending); return pending;
}

export function CustomerVerify() {
  const { user, refresh } = useCustomer();
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0); const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    if (user && !user.emailVerified) {
      void sendVerificationOnce(user.uid).then(() => {
        if (mounted.current) { setNotice("Your verification link has been sent. Check your inbox and spam folder."); setCooldown(Math.max(0, 60 - Math.floor((Date.now() - Number(sessionStorage.getItem(`autodrive-verification-${user.uid}`))) / 1000))); }
      }).catch((e) => { if (mounted.current) setError(errorMessage(e)); });
    }
    return () => { mounted.current = false; };
  }, [user]);
  useEffect(() => { if (!cooldown) return; const id = window.setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000); return () => clearInterval(id); }, [cooldown]);
  return <div className="customer-card customer-narrow text-center"><MailCheck size={48} className="mx-auto mb-5 text-gold" />
    <h1>Verify your email</h1><p>Open the verification link sent to <strong>{user?.email}</strong>, then return here to continue.</p>
    {notice && <div role="status" className="customer-notice">{notice}</div>}{error && <div role="alert" className="customer-error">{error}</div>}
    <button className="customer-primary customer-full" disabled={busy} onClick={async () => {
      setBusy(true); setError(""); try {
        await user?.reload(); const current = client().auth.currentUser;
        if (!current?.emailVerified) { setError("This email has not been verified yet. Open the link first, then try again."); return; }
        await setDoc(doc(client().db, "users", current.uid), { emailVerifiedAt: serverTimestamp() }, { merge: true });
        await refresh(); void track("cta_tapped", { screenName: "email_verification", ctaLabel: "Email verification completed" });
      } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
    }}>{busy ? "Checking…" : "I have verified my email"}</button>
    <button className="customer-link customer-small mt-5" disabled={busy || cooldown > 0} onClick={async () => {
      if (!user) return; setBusy(true); setError(""); try { await sendVerificationOnce(user.uid, true); setCooldown(60); setNotice("A new verification link has been sent."); }
      catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
    }}>{cooldown > 0 ? `Resend available in ${cooldown}s` : "Send another link"}</button>
  </div>;
}
