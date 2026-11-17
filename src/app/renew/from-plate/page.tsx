"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { getFirebaseClient } from "@/lib/firebase";

export default function PlateAccountPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function openFreshSignup() {
      const configured = getFirebaseClient();
      if (!configured) throw new Error("Account services unavailable");

      const { auth } = configured;
      await auth.authStateReady();
      if (!active) return;
      if (auth.currentUser) await signOut(auth);
      if (!active) return;
      if (auth.currentUser) throw new Error("A session is still active");

      const intent = new URLSearchParams(window.location.search).get("intent");
      window.location.replace(intent === "renew" ? "/renew/welcome" : "/renew/sign-up");
    }

    void openFreshSignup().catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  return <div className="customer"><main className="customer-card customer-narrow">
    <h1>Continue to AutoDrive</h1>
    {failed ? <>
      <p role="alert">We couldn’t start a fresh sign-in. Please try again.</p>
      <button className="customer-primary" onClick={() => window.location.reload()}>Try again</button>
    </> : <p role="status">Preparing a fresh sign-in…</p>}
    <Link className="customer-link customer-small mt-5 block" href="/">Back to AutoDrive</Link>
  </main></div>;
}
