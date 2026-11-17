"use client";

import { useEffect, useRef, useState } from "react";
import { browserSessionPersistence, isSignInWithEmailLink, setPersistence, signInWithEmailLink, signOut, type User } from "firebase/auth";
import { doc, runTransaction } from "firebase/firestore";
import Link from "next/link";
import { client, errorMessage, registrationAgent, registrationData, track } from "@/lib/customer";
import { clearEmailDraft, clearVerifiedPlate, readEmailDraft, rememberVerifiedPlate, requestEmailLink } from "@/lib/email-link";

export default function PlateAccountPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [shouldResend, setShouldResend] = useState(false);
  const draftId = useRef<string | null>(null);
  const provenUser = useRef<User | null>(null);

  useEffect(() => {
    draftId.current = new URLSearchParams(window.location.search).get("draft");
    setEmail(readEmailDraft(draftId.current)?.email || "");
    try { setInvalid(!isSignInWithEmailLink(client().auth, window.location.href)); }
    catch { setInvalid(true); }
  }, []);

  async function complete() {
    const { auth, db } = client();
    const enteredEmail = email.trim().toLowerCase();
    const pending = readEmailDraft(draftId.current);
    const draft = pending?.email === enteredEmail ? pending.plateDraft : undefined;
    let user = provenUser.current;
    if (!user) {
      const link = window.location.href;
      if (!isSignInWithEmailLink(auth, link)) throw new Error("Open the link we sent to your email.");
      await auth.authStateReady();
      if (auth.currentUser) await signOut(auth);
      clearVerifiedPlate();
      await setPersistence(auth, browserSessionPersistence);
      user = (await signInWithEmailLink(auth, enteredEmail, link)).user;
      provenUser.current = user;
      window.history.replaceState(null, "", "/renew/from-plate");
    }
    if (!user.emailVerified || user.email?.toLowerCase() !== enteredEmail || auth.currentUser?.uid !== user.uid) {
      throw new Error("Confirm the email address you used to request the link.");
    }
    const ref = doc(db, "users", user.uid);
    const authenticated = user;
    const agentId = draft ? await registrationAgent("") : undefined;
    const profile = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists()) return snapshot.data();
      if (!draft || !agentId) return null;
      const data = registrationData({ uid: authenticated.uid, email: enteredEmail, fullName: draft.fullName, agentId, accountType: "personal" });
      transaction.set(ref, data);
      return data;
    });
    if (auth.currentUser?.uid !== user.uid) throw new Error("Your session changed. Request a new sign-in link.");
    const resumePlate = draft && profile?.role === "buyer" && rememberVerifiedPlate(user.uid, draft);
    clearEmailDraft(draftId.current);
    void track("cta_tapped", { screenName: "web_email_link", ctaLabel: "Confirm email sign-in" });
    const destination = resumePlate
      ? (profile.buyerOnboardingCompleted ? "/renew/add-vehicle" : "/renew/onboarding")
      : "/renew";
    window.location.replace(destination);
  }

  async function submit(resend: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (resend) {
        const previous = readEmailDraft(draftId.current);
        await requestEmailLink(email, previous?.email === email.trim().toLowerCase() ? previous.plateDraft : undefined);
        setSent(true);
      } else {
        await complete();
      }
    } catch (failure) {
      const code = (failure as { code?: string })?.code;
      if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
        setShouldResend(true);
        setError("This link is expired or has already been used. Check the email address or request a new link.");
      } else {
        setError(errorMessage(failure));
      }
    } finally { setBusy(false); }
  }

  return <div className="customer"><main className="customer-card customer-narrow">
    <h1>{sent ? "Check your inbox" : "Sign in with your email"}</h1>
    {sent ? <p role="status">Open the new sign-in link we sent to your email.</p> : <>
      {!invalid && <p>Confirm the email address you used to request this link.</p>}
      <form onSubmit={(event) => { event.preventDefault(); void submit(invalid); }}>
        <label className="customer-field"><span>Email address</span>
          <input required type="email" autoComplete="email" value={email} readOnly={Boolean(provenUser.current)} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {error && <p className="customer-error" role="alert">{error}</p>}
        <button type="submit" className="customer-primary customer-full" disabled={busy}>{busy ? "Please wait…" : invalid ? "Send me a sign-in link" : "Confirm and continue"}</button>
        {shouldResend && <button type="button" className="customer-link mt-4" disabled={busy || !email.trim()} onClick={() => void submit(true)}>Send a new link</button>}
      </form>
    </>}
    <Link className="customer-link customer-small mt-5 block" href="/#plate-check">Back to plate check</Link>
  </main></div>;
}
