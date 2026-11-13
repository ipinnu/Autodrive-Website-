"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Bell, Search } from "lucide-react";
import Link from "next/link";
import { track } from "@/lib/customer";
import VehicleIcon from "./VehicleIcon";

const apiBase = process.env.NEXT_PUBLIC_DELIVERY_API_BASE_URL ||
  "https://autodrive-delivery-api.autodrive-ng-f0f.workers.dev";

type Status = "expired" | "watch" | "current" | "unknown";
type PlateResult = {
  vehicle?: { make: string; model: string };
  documents: { type: string; expiryDate: string | null; status: Status }[];
  reminder: { firstDate: string; lastDate: string; receipt: string } | null;
};

const statusLabels: Record<Status, string> = {
  expired: "Expired",
  watch: "Expiring soon",
  current: "Current",
  unknown: "Date unavailable",
};

const statusStyles: Record<Status, string> = {
  expired: "text-red-800",
  watch: "text-[#735621]",
  current: "text-emerald-800",
  unknown: "text-slate-600",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(date));
}

async function plateRequest<T>(action: "lookup" | "reminder", data: Record<string, string>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase.replace(/\/$/, "")}/v1/public/plate/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error("The plate checker is temporarily unavailable. Please try again.");
  }
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    throw new Error(failure?.message || "We couldn’t complete that request. Please try again.");
  }
  return response.json();
}

export default function PlateCheckSection() {
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<PlateResult | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [reminderError, setReminderError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDate, setSavedDate] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");

  async function checkPlate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lookingUp || saving) return;
    setResult(null);
    setLookupError("");
    setReminderError("");
    setSavedDate("");
    setDate("");
    setEmail("");
    setLookingUp(true);
    void track("cta_tapped", { screenName: "web_home_plate_check", ctaLabel: "Check my plate" });
    try {
      setResult(await plateRequest<PlateResult>("lookup", { plateNumber: plate }));
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLookingUp(false);
    }
  }

  async function saveReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result?.reminder || saving) return;
    setSaving(true);
    setReminderError("");
    try {
      await plateRequest("reminder", { email, date, receipt: result.reminder.receipt });
      setSavedDate(date);
      setEmail("");
      void track("cta_tapped", { screenName: "web_home_plate_check", ctaLabel: "Set email reminder" });
    } catch (error) {
      setReminderError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const expired = result?.documents.some(({ status }) => status === "expired");
  const watch = result?.documents.some(({ status }) => status === "watch");
  const hasKnownDates = result?.documents.some(({ status }) => status !== "unknown");
  const incomplete = result?.documents.some(({ status }) => status === "unknown");
  const reminderHeading = "mb-1 flex items-center gap-2 font-semibold text-navy";
  const reminderPanel = "mt-6 rounded-2xl border border-[#e6d9be] bg-[#fcf9f2] p-4 sm:p-6";
  const fieldStyle = "min-h-12 w-full rounded-xl border border-[#b7c8e2] bg-white px-4 text-navy outline-none focus:border-[#a1824a] focus:ring-2 focus:ring-[#a1824a]/30";
  const buttonStyle = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy px-5 font-semibold text-white hover:bg-[#204583] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a1824a] disabled:opacity-60";

  return (
    <section id="plate-check" aria-labelledby="plate-check-title" className="scroll-mt-28 bg-[#f0f5fd] section-padding">
      <div className="container-wide">
        <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-[#dbe6f5] bg-white p-5 shadow-[0_24px_65px_-44px_rgba(18,49,107,0.5)] sm:p-10">
          <div aria-hidden="true" className="mb-5 h-0.5 w-10 rounded-full bg-gold" />
          <h2 id="plate-check-title" className="font-lora text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Check your car papers
          </h2>
          <p className="mt-3 text-navy/75">Enter your plate number to see when your papers expire.</p>
          <form onSubmit={checkPlate} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label htmlFor="home-plate-number" className="min-w-0 flex-1 text-sm font-semibold text-navy">
              Licence plate number
              <input id="home-plate-number" className={`mt-2 ${fieldStyle}`} value={plate}
                onChange={(event) => { setPlate(event.target.value.toUpperCase()); setResult(null); setLookupError(""); }}
                placeholder="ABC123DE" autoCapitalize="characters" autoComplete="off" spellCheck={false}
                maxLength={24} required disabled={lookingUp || saving} />
            </label>
            <button type="submit" className={buttonStyle} disabled={lookingUp || saving}>
              <Search size={18} className="text-[#e9cd94]" aria-hidden="true" /> {lookingUp ? "Checking…" : "Check my plate"}
            </button>
          </form>
          {lookingUp && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-navy/75"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold motion-safe:animate-pulse" />Looking up your vehicle papers…</p>}
          {lookupError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{lookupError}</p>}

          {result && <div className="mt-7 border-t border-[#e6d9be] pt-6">
            {result.vehicle && (
              <header className="mb-4 flex items-center gap-3 sm:gap-4">
                <div className="flex shrink-0 items-center justify-center">
                  <VehicleIcon make={result.vehicle.make} />
                </div>
                <h3 className="min-w-0 break-words text-navy">
                  {result.vehicle.make && (
                    <span className={result.vehicle.model
                      ? "block text-xs font-semibold uppercase tracking-[0.18em] text-[#735621]"
                      : "block font-lora text-2xl font-semibold sm:text-3xl"}>
                      {result.vehicle.make}
                    </span>
                  )}
                  {result.vehicle.model && (
                    <span className="block font-lora text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                      {result.vehicle.model}
                    </span>
                  )}
                </h3>
              </header>
            )}
            <div role="status" className={`rounded-xl border p-4 ${expired ? "border-red-200 bg-red-50 text-red-900" :
              watch ? "border-[#e6d9be] bg-[#fcf9f2] text-[#624a20]" :
                !hasKnownDates || incomplete ? "border-blue-200 bg-blue-50 text-navy" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
              <p className="font-semibold">{expired ? "One or more documents have expired" :
                watch ? "A document expires within three months" :
                  !hasKnownDates ? "Expiry dates are unavailable" : incomplete ? "Some expiry dates are unavailable" : "Your checked documents are up to date"}</p>
              {expired && <p className="mt-1 text-sm">Renew today to avoid fines of up to ₦25,000.</p>}
              {watch && !expired && <p className="mt-1 text-sm">Keep a close eye on it and renew before it expires.</p>}
              {!hasKnownDates && <p className="mt-1 text-sm">Check the dates on your vehicle papers.</p>}
            </div>
            <dl className="mt-4 divide-y divide-[#eee7d8]">
              {result.documents.map((document) => <div key={document.type} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3 text-sm">
                <dt className="font-semibold text-navy">{document.type === "Vehicle License" ? "Vehicle Licence" : document.type}</dt>
                <dd className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-left sm:justify-end ${statusStyles[document.status]}`}>
                  <span className="font-medium">{statusLabels[document.status]}</span>
                  {document.expiryDate && <time dateTime={document.expiryDate} className="border-l border-[#d6c299] pl-2 text-navy/75">
                    {formatDate(document.expiryDate)}
                  </time>}
                </dd>
              </div>)}
            </dl>
            {expired && <Link href="/renew/welcome" className={`mt-4 ${buttonStyle}`}>
              Renew today <ArrowRight size={18} className="text-[#e9cd94]" aria-hidden="true" />
            </Link>}
            {savedDate ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 border-l-2 border-l-[#a1824a] bg-emerald-50 p-4 font-medium text-emerald-900">
              Reminder saved for {formatDate(savedDate)}.
            </p> : result.reminder && <form onSubmit={saveReminder} className={reminderPanel}>
              <h3 className={reminderHeading}>
                <Bell size={17} className="shrink-0 text-[#8a6b32]" aria-hidden="true" />
                Register your email for easier renewals
              </h3>
              <p className="mb-4 mt-1 text-sm text-navy/75">Choose a date for a one-time reminder with a link to renew online.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="min-w-0 text-sm font-semibold text-navy">
                  Email address
                  <input type="email" autoComplete="email" required maxLength={254} value={email}
                    onChange={(event) => setEmail(event.target.value)} className={`mt-2 ${fieldStyle}`} />
                </label>
                <label className="min-w-0 text-sm font-semibold text-navy">
                  Reminder date
                  <input type="date" required min={result.reminder.firstDate} max={result.reminder.lastDate}
                    value={date} onChange={(event) => setDate(event.target.value)} className={`mt-2 ${fieldStyle}`} />
                </label>
              </div>
              {reminderError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{reminderError}</p>}
              <button type="submit" className={`mt-4 ${buttonStyle}`} disabled={saving}>
                {saving ? "Saving…" : "Set email reminder"}
              </button>
            </form>}
            {!expired && !result.reminder && <div className={reminderPanel}>
              <h3 className={reminderHeading}>
                <Bell size={17} className="shrink-0 text-[#8a6b32]" aria-hidden="true" />
                Register your email for easier renewals
              </h3>
              <p className="mt-1 text-sm text-navy/75">Create an AutoDrive account to track your papers and renew online when they are due.</p>
              <Link href="/renew/sign-up" className={'mt-4 ' + buttonStyle}>Register with email</Link>
            </div>}
          </div>}
        </div>
      </div>
    </section>
  );
}

