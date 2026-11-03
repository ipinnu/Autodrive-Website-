"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CarFront, FileCheck2, LogOut } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase";
import { client, errorMessage, track, type AccountType, type BuyerProfile } from "@/lib/customer";

type CustomerContext = { user: User | null; profile: BuyerProfile | null; accountType: AccountType;
  chooseAccountType: (type: AccountType) => void; refresh: () => Promise<void> };
const Context = createContext<CustomerContext | null>(null);
export function useCustomer() {
  const value = useContext(Context);
  if (!value) throw new Error("Customer pages must use CustomerProvider.");
  return value;
}
const publicPaths = ["/renew/welcome", "/renew/sign-in", "/renew/sign-up"];

export default function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [revision, setRevision] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const previous = useRef({ path: "website", at: Date.now() });

  useEffect(() => {
    if (sessionStorage.getItem("autodrive-account-type") === "organization") setAccountType("organization");
  }, []);
  useEffect(() => {
    const configured = getFirebaseClient();
    if (!configured) { setProblem("Account services are temporarily unavailable. Please try again shortly."); setLoading(false); return; }
    let stopProfile: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(configured.auth, (current) => {
      stopProfile?.(); setUser(current); setProfile(null); setProblem("");
      if (!current) { setLoading(false); return; }
      setLoading(true);
      stopProfile = onSnapshot(doc(configured.db, "users", current.uid), (snapshot) => {
        setProfile(snapshot.exists() ? snapshot.data() as BuyerProfile : null); setLoading(false);
      }, (error) => { setProblem(errorMessage(error)); setLoading(false); });
    }, (error) => { setProblem(errorMessage(error)); setLoading(false); });
    return () => { stopAuth(); stopProfile?.(); };
  }, [revision]);

  const destination = loading || problem ? null : !user
    ? (publicPaths.includes(pathname) ? null : "/renew/welcome")
    : !profile ? (pathname === "/renew/sign-up" ? null : "/renew/sign-up")
    : profile.role === "buyer" && !profile.fullName?.trim()
      ? (pathname === "/renew/sign-up" ? null : "/renew/sign-up")
    : profile.role !== "buyer" ? null
    : !user.emailVerified ? (pathname === "/renew/verify" ? null : "/renew/verify")
    : !profile.buyerOnboardingCompleted ? (pathname === "/renew/onboarding" ? null : "/renew/onboarding")
    : publicPaths.includes(pathname) || pathname === "/renew/verify" || pathname === "/renew/onboarding" ? "/renew" : null;
  useEffect(() => { if (destination) router.replace(destination); }, [destination, router]);
  useEffect(() => {
    if (loading || destination || !user) return;
    void track("screen_viewed", { screenName: pathname, previousScreen: previous.current.path,
      timeOnPreviousScreenMs: Date.now() - previous.current.at });
    previous.current = { path: pathname, at: Date.now() };
  }, [pathname, user, loading, destination]);

  const value = useMemo<CustomerContext>(() => ({ user, profile, accountType,
    chooseAccountType(type) { setAccountType(type); sessionStorage.setItem("autodrive-account-type", type);
      void track("cta_tapped", { screenName: pathname, ctaLabel: "Select account type", accountType: type }); },
    async refresh() { await client().auth.currentUser?.reload(); await client().auth.currentUser?.getIdToken(true); setRevision((n) => n + 1); },
  }), [user, profile, accountType, pathname]);

  const ready = Boolean(user?.emailVerified && profile?.role === "buyer" && profile.buyerOnboardingCompleted);
  return <Context.Provider value={value}><div className="customer">
    <header className="customer-header"><div className="customer-header-inner">
      <Link href="/" aria-label="AutoDrive home"><Image src="/images/logo-full.png" alt="AutoDrive" width={145} height={48} priority /></Link>
      {ready && <nav aria-label="Customer navigation"><Link className={pathname === "/renew" ? "selected" : ""} href="/renew"><CarFront size={18} /> Vehicles</Link>
        <Link className={pathname === "/renew/orders" ? "selected" : ""} href="/renew/orders"><FileCheck2 size={18} /> Renewals</Link></nav>}
      {user && <button className="customer-signout" onClick={async () => { void track("cta_tapped", { screenName: pathname, ctaLabel: "Sign out" }); await signOut(client().auth); router.replace("/renew/welcome"); }}><LogOut size={16} /><span>Sign out</span></button>}
    </div></header>
    {loading || destination ? <div className="customer-loading" role="status"><span className="customer-spinner" />Loading your account…</div>
      : problem ? <div className="customer-card customer-narrow"><h1>Let’s reconnect</h1><p role="alert">{problem}</p><button className="customer-primary" onClick={() => setRevision((n) => n + 1)}>Try again</button></div>
      : user && profile && profile.role !== "buyer" ? <div className="customer-card customer-narrow"><h1>Customer renewal accounts</h1><p>You are signed in with a staff or agent account. Use a personal or organization customer account to renew your papers.</p><Link className="customer-primary" href="/dashboard">Open admin dashboard</Link></div>
      : children}
  </div></Context.Provider>;
}
