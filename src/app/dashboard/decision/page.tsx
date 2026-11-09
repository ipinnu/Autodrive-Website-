"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { getFirebaseClient, isFirebaseConfigured } from "@/lib/firebase";

type DataState = "idle" | "loading" | "ready" | "unconfigured" | "error";
type PayoutMode = "auto" | "manual";

type PayoutReview = {
  orderId: string;
  buyerId: string;
  agentId: string;
  amountNGN: number;
  payoutAmountNGN: number;
  payoutMode: string;
  reviewStatus: string;
  transferStatus: string;
  paymentStatus: string;
  paidAt?: string | null;
  recipient?: {
    status?: string;
    bankName?: string;
    accountNumberMasked?: string;
    agentId?: string;
  };
};

type PayoutAutomation = {
  mode: PayoutMode;
  pendingReviews: PayoutReview[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_AUTODRIVE_DELIVERY_API_BASE_URL?.replace(/\/$/, "") ?? "";

function money(value: number | undefined) {
  return `₦${Number(value ?? 0).toLocaleString()}`;
}

function timeLabel(value?: string | null) {
  if (!value) return "No paid timestamp";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

async function authHeaders(user: User) {
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function workerRequest<T>(
  user: User,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("Set NEXT_PUBLIC_AUTODRIVE_DELIVERY_API_BASE_URL in Vercel.");
  }
  const headers = await authHeaders(user);
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message ?? "Cloudflare request failed.");
  }
  return body as T;
}

function DashboardLogin({ onLogin, error }: { onLogin: (email: string, password: string) => void; error: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen bg-[#F4F6FA] px-4 py-12">
      <div className="mx-auto max-w-md rounded-lg border border-navy/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-navy text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-gold">Admin only</p>
        <h1 className="font-lora text-3xl font-bold text-navy">Dashboard login</h1>
        <p className="mt-2 text-sm leading-6 text-navy/60">Sign in with a Firebase admin account. No sign-up is available from this page.</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); onLogin(email, password); }}>
          <label className="block">
            <span className="text-sm font-bold text-navy">Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-navy outline-none transition focus:border-gold" placeholder="admin@autodrive.ng" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-navy">Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-navy outline-none transition focus:border-gold" placeholder="Firebase password" />
          </label>
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
          <button type="submit" className="w-full rounded-md bg-navy px-4 py-3 text-sm font-black text-white transition hover:bg-gold">Continue to dashboard</button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="border-b border-navy/10 bg-white px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center justify-between lg:block">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">AutoDrive</p>
          <h1 className="font-lora text-2xl font-bold text-navy">Dashboard</h1>
        </div>
        <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-md border border-navy/15 px-3 py-2 text-sm font-bold text-navy lg:hidden">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
      <nav className="mt-5 grid gap-2">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-navy/70 transition hover:bg-navy/5 hover:text-navy"><LayoutDashboard className="h-4 w-4" /> Overview</Link>
        <Link href="/dashboard/decision" className="flex items-center gap-3 rounded-md bg-navy px-3 py-3 text-sm font-black text-white"><BarChart3 className="h-4 w-4" /> Decision</Link>
      </nav>
      <button type="button" onClick={onLogout} className="mt-8 hidden w-full items-center justify-center gap-2 rounded-md border border-navy/15 px-3 py-2.5 text-sm font-bold text-navy transition hover:border-gold hover:text-gold lg:inline-flex">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </aside>
  );
}

export default function DecisionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState("");
  const [dataState, setDataState] = useState<DataState>("idle");
  const [message, setMessage] = useState("");
  const [automation, setAutomation] = useState<PayoutAutomation | null>(null);
  const [savingMode, setSavingMode] = useState<PayoutMode | null>(null);
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null);

  const pendingTotal = useMemo(
    () => automation?.pendingReviews.reduce((total, review) => total + review.payoutAmountNGN, 0) ?? 0,
    [automation],
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setDataState("unconfigured");
      return;
    }
    const client = getFirebaseClient();
    if (!client) return;
    return onAuthStateChanged(client.auth, setUser);
  }, []);

  const loadAutomation = useCallback(async (currentUser = user) => {
    if (!currentUser) return;
    setDataState("loading");
    setMessage("");
    try {
      const body = await workerRequest<{ payoutAutomation: PayoutAutomation }>(
        currentUser,
        "/v1/admin/payout-automation",
      );
      setAutomation(body.payoutAutomation);
      setDataState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load payout automation.");
      setDataState("error");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadAutomation(user);
    }
  }, [loadAutomation, user]);

  async function updateMode(mode: PayoutMode) {
    if (!user) return;
    setSavingMode(mode);
    setMessage("");
    try {
      const body = await workerRequest<{ payoutAutomation: { mode: PayoutMode } }>(
        user,
        "/v1/admin/payout-automation",
        { method: "POST", body: JSON.stringify({ mode }) },
      );
      setAutomation((current) => ({
        mode: body.payoutAutomation.mode,
        pendingReviews: current?.pendingReviews ?? [],
      }));
      setMessage(`Payout automation is now ${mode}.`);
      await loadAutomation(user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update payout automation.");
    } finally {
      setSavingMode(null);
    }
  }

  async function approveReview(orderId: string) {
    if (!user) return;
    setApprovingOrder(orderId);
    setMessage("");
    try {
      await workerRequest(
        user,
        `/v1/admin/payout-reviews/${encodeURIComponent(orderId)}/approve`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setMessage(`Payout review ${orderId} approved in Cloudflare.`);
      await loadAutomation(user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not approve payout review.");
    } finally {
      setApprovingOrder(null);
    }
  }

  async function handleLogin(email: string, password: string) {
    setLoginError("");
    if (!isFirebaseConfigured) {
      setLoginError("Firebase browser config is missing in Vercel env vars.");
      return;
    }
    try {
      const client = getFirebaseClient();
      if (!client) throw new Error("Firebase is not configured");
      await signInWithEmailAndPassword(client.auth, email, password);
    } catch {
      setLoginError("Could not sign in. Confirm this is an admin Firebase account.");
    }
  }

  async function handleLogout() {
    const client = getFirebaseClient();
    if (client) await signOut(client.auth);
    setUser(null);
    setAutomation(null);
  }

  if (!user) return <DashboardLogin onLogin={handleLogin} error={loginError} />;

  return (
    <div className="min-h-screen bg-[#F4F6FA] lg:pl-80">
      <Sidebar onLogout={handleLogout} />
      <main className="px-4 py-6 md:px-8 lg:px-12">
        <header className="mb-6 flex flex-col gap-4 border-b border-navy/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-gold">Decision</p>
            <h2 className="font-lora text-3xl font-bold text-navy md:text-4xl">Payout decisions</h2>
            <p className="mt-2 max-w-3xl text-base leading-7 text-navy/65">Control whether agent payouts run automatically or stop for manual review before release.</p>
          </div>
          <button type="button" onClick={() => loadAutomation()} className="inline-flex w-fit items-center gap-2 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm font-bold text-navy transition hover:border-gold hover:text-gold">
            <RefreshCw className={`h-4 w-4 ${dataState === "loading" ? "animate-spin" : ""}`} /> Refresh
          </button>
        </header>

        {!apiBaseUrl ? (
          <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Set `NEXT_PUBLIC_AUTODRIVE_DELIVERY_API_BASE_URL` to your Cloudflare Worker URL so this page can call the payout controls.
          </div>
        ) : null}

        {message ? (
          <div className="mb-5 flex items-start gap-3 rounded-md border border-navy/10 bg-white p-4 text-sm font-bold text-navy/70 shadow-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-gold" />
            <p>{message}</p>
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-lg border border-navy/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Mode</p>
            <h3 className="mt-1 font-lora text-2xl font-bold text-navy">{automation?.mode === "manual" ? "Manual review" : "Auto payout"}</h3>
            <p className="mt-2 text-sm leading-6 text-navy/62">Manual mode makes every verified order wait here before payout approval is triggered through Cloudflare.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-md bg-[#F4F6FA] p-1">
              {(["auto", "manual"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateMode(mode)}
                  disabled={savingMode != null || automation?.mode === mode}
                  className={`rounded-md px-3 py-2.5 text-sm font-black transition ${automation?.mode === mode ? "bg-navy text-white" : "text-navy/70 hover:bg-white"}`}
                >
                  {savingMode === mode ? "Saving..." : mode === "auto" ? "Auto" : "Manual"}
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-navy/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Queue</p>
            <h3 className="mt-1 font-lora text-2xl font-bold text-navy">{automation?.pendingReviews.length ?? 0} reviews</h3>
            <p className="mt-2 text-sm leading-6 text-navy/62">Transactions waiting for a human decision before the payout trigger proceeds.</p>
          </article>

          <article className="rounded-lg border border-navy/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Amount</p>
            <h3 className="mt-1 font-lora text-2xl font-bold text-navy">{money(pendingTotal)}</h3>
            <p className="mt-2 text-sm leading-6 text-navy/62">Agent service payout value currently held in manual review.</p>
          </article>
        </section>

        <section className="mt-6 rounded-lg border border-navy/10 bg-white shadow-sm">
          <div className="border-b border-navy/10 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Manual payout review</p>
            <h3 className="mt-1 font-lora text-2xl font-bold text-navy">Transactions waiting for approval</h3>
          </div>
          <div className="max-h-[64vh] overflow-y-auto p-5">
            {dataState === "loading" ? (
              <p className="rounded-md bg-[#F4F6FA] p-4 text-sm font-bold text-navy/60">Loading payout reviews...</p>
            ) : automation?.pendingReviews.length ? (
              <ul className="divide-y divide-slate-200">
                {automation.pendingReviews.map((review) => (
                  <li key={review.orderId} className="grid gap-4 py-4 xl:grid-cols-[1fr_1fr_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-navy">{review.orderId}</p>
                        {review.payoutMode === "test" ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">300 test</span> : null}
                        <span className="rounded-full bg-[#F4F6FA] px-2.5 py-1 text-xs font-black text-navy/65">{review.paymentStatus || "payment verified"}</span>
                      </div>
                      <p className="mt-2 text-sm text-navy/58">Buyer: {review.buyerId || "unknown"}</p>
                      <p className="text-sm text-navy/58">Agent: {review.agentId || "unknown"}</p>
                      <p className="text-sm text-navy/58">{timeLabel(review.paidAt)}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md bg-[#F4F6FA] p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/45">Paid</p>
                        <p className="mt-1 text-lg font-black text-navy">{money(review.amountNGN)}</p>
                      </div>
                      <div className="rounded-md bg-[#F4F6FA] p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/45">Agent payout</p>
                        <p className="mt-1 text-lg font-black text-navy">{money(review.payoutAmountNGN)}</p>
                      </div>
                      <div className="sm:col-span-2 rounded-md bg-[#F4F6FA] p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/45">Recipient</p>
                        <p className="mt-1 text-sm font-black text-navy">
                          {review.recipient?.status === "verified"
                            ? `${review.recipient.bankName ?? "Bank"} · ${review.recipient.accountNumberMasked ?? "masked"}`
                            : "No verified recipient"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => approveReview(review.orderId)}
                      disabled={approvingOrder != null || review.recipient?.status !== "verified"}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-3 text-sm font-black text-white transition hover:bg-gold disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {approvingOrder === review.orderId ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Approve
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-md bg-[#F4F6FA] p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-black text-navy">No payout reviews waiting.</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-navy/62">When manual mode is on, newly verified transactions will appear here before payout approval.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
