"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { collection, doc, limit, onSnapshot, query, where } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CarFront, FileCheck2, LogOut, Truck } from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase";
import { client, errorMessage, track, type AccountType, type BuyerProfile } from "@/lib/customer";
import { readCheckout, rememberCheckout } from "@/lib/checkout-recovery";

type CustomerContext = { user: User | null; profile: BuyerProfile | null; accountType: AccountType;
  chooseAccountType: (type: AccountType) => void; refresh: () => Promise<void> };
const Context = createContext<CustomerContext | null>(null);
export function useCustomer() {
  const value = useContext(Context);
  if (!value) throw new Error("Customer pages must use CustomerProvider.");
  return value;
}
const publicPaths = ["/renew/welcome", "/renew/sign-in", "/renew/sign-up"];

function DeliveryBanner({ uid, pathname }: { uid: string; pathname: string }) {
  const [active, setActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const db = client().db;
    const stops = ["Orders", "CompletedOrders"].map((name) => {
      const deliveries = query(collection(db, name),
        where("uid", "==", uid), where("deliveryStatus", "==", "out_for_delivery"), limit(1));
      const update = (found: boolean) => setActive((current) => ({ ...current, [name]: found }));
      return onSnapshot(deliveries, (snapshot) => update(!snapshot.empty), () => update(false));
    });
    return () => stops.forEach((stop) => stop());
  }, [uid]);

  if (!Object.values(active).some(Boolean)) return null;
  return <aside className="customer-delivery-banner" aria-label="Delivery status">
    <div>
      <span role="status"><Truck size={18} aria-hidden="true" /> Delivery in progress</span>
      <a href="/renew/orders?tab=ongoing" onClick={() => void track("cta_tapped", {
        screenName: pathname, ctaLabel: "View delivery",
      })}>View delivery <span aria-hidden="true">→</span></a>
    </div>
  </aside>;
}

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
    ? ((publicPaths.includes(pathname) || pathname === "/renew/whatsapp") ? null : "/renew/welcome")
    : !profile ? (pathname === "/renew/sign-up" ? null : "/renew/sign-up")
    : profile.role === "buyer" && !profile.fullName?.trim()
      ? (pathname === "/renew/sign-up" ? null : "/renew/sign-up")
    : profile.role !== "buyer" ? null
    : !user.emailVerified ? (pathname === "/renew/verify" ? null : "/renew/verify")
    : !profile.buyerOnboardingCompleted ? (pathname === "/renew/onboarding" ? null : "/renew/onboarding")
    : publicPaths.includes(pathname) || pathname === "/renew/verify" || pathname === "/renew/onboarding" ? "/renew" : null;
  useEffect(() => {
    if (pathname === "/renew/whatsapp") {
      const code = window.location.hash.slice(1);
      if (/^[a-f0-9]{64}$/.test(code)) {
        try { sessionStorage.setItem("autodrive-whatsapp-handoff", code); } catch {}
      }
    }
    const reopeningGarage = pathname === "/renew" && !loading && !problem && !destination && user?.emailVerified && profile?.role === "buyer" && profile.buyerOnboardingCompleted;
    if (!user && pathname === "/renew/orders") {
      const ref = new URLSearchParams(window.location.search).get("tx_ref");
      if (ref) rememberCheckout(ref);
    }
    if (user && (destination === "/renew" || reopeningGarage)) {
      let whatsappCode: string | null = null;
      try { whatsappCode = sessionStorage.getItem("autodrive-whatsapp-handoff"); } catch {}
      if (whatsappCode && /^[a-f0-9]{64}$/.test(whatsappCode)) {
        router.replace("/renew/whatsapp#" + whatsappCode);
        return;
      }
      const returned = readCheckout(undefined, true);
      const pending = readCheckout(user.uid, true);
      const ref = returned || pending;
      if (ref) {
        router.replace("/renew/orders?tx_ref=" + encodeURIComponent(ref));
        return;
      }
    }
    if (destination) router.replace(destination);
  }, [destination, loading, pathname, problem, profile, router, user]);
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
        <Link className={["/renew/orders", "/renew/checkout"].includes(pathname) ? "selected" : ""} href="/renew/orders"><FileCheck2 size={18} /> Renewals</Link></nav>}
      {user && <button className="customer-signout" onClick={async () => { void track("cta_tapped", { screenName: pathname, ctaLabel: "Sign out" }); await signOut(client().auth); router.replace("/renew/welcome"); }}><LogOut size={16} /><span>Sign out</span></button>}
    </div></header>
    {ready && !loading && !destination && !problem && user && <DeliveryBanner key={user.uid} uid={user.uid} pathname={pathname} />}
    {loading || destination ? <div className="customer-loading" role="status"><span className="customer-spinner" />Loading your account…</div>
      : problem ? <div className="customer-card customer-narrow"><h1>Let’s reconnect</h1><p role="alert">{problem}</p><button className="customer-primary" onClick={() => setRevision((n) => n + 1)}>Try again</button></div>
      : user && profile && profile.role !== "buyer" ? <div className="customer-card customer-narrow"><h1>Customer renewal accounts</h1><p>You are signed in with a staff or agent account. Use a personal or organization customer account to renew your papers.</p><Link className="customer-primary" href="/dashboard">Open admin dashboard</Link></div>
      : children}
  </div></Context.Provider>;
}
