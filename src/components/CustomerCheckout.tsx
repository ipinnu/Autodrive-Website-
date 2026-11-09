"use client";
import { rememberCheckout } from "@/lib/checkout-recovery";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, X } from "lucide-react";
import { customerApi, money, savedAddresses, saveAddress, uploadEvidence, type Address, type Quote, type Selection } from "@/lib/customer-checkout";
import { errorMessage, track, type Vehicle } from "@/lib/customer";
import RenewalRegistration from "./RenewalRegistration";
import PriceBreakdown from "./PriceBreakdown";
import DeliveryAddressPicker from "./DeliveryAddressPicker";
import DeliveryDatePicker from "./DeliveryDatePicker";
import { useCustomer } from "./CustomerProvider";
import { sameSelection, saveRenewalDraft } from "@/lib/renewal-draft";

export default function CustomerCheckout({ selection, vehicles, onRegistrationSaved, onBusyChange, mode = "review", initialQuote }: {
  selection: Selection[]; vehicles: Vehicle[];
  mode?: "review" | "details"; initialQuote?: Quote;
  onRegistrationSaved: (carId: string, plate: string, state: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { user } = useCustomer(); const router = useRouter();
  const [quoteResult, setQuoteResult] = useState<{ requestKey: string; quote: Quote } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<Record<string, File>>({}); const [addresses, setAddresses] = useState<Address[]>([]); const [address, setAddress] = useState<Address | null>(null);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const uploadInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [addressesLoading, setAddressesLoading] = useState(mode === "details");
  const [addressEditing, setAddressEditing] = useState(false); const [registrationSaves, setRegistrationSaves] = useState(0);
  const [confirmed, setConfirmed] = useState(false); const [date, setDate] = useState("");
  const [status, setStatus] = useState(""); const [refreshKey, setRefreshKey] = useState(0);
  const key = JSON.stringify(selection);
  const requestKey = `${key}:${refreshKey}`;
  const quote = quoteResult?.requestKey === requestKey ? quoteResult.quote : null;
  const selectedCars = vehicles.filter((car) => selection.some((s) => s.carId === car.carId));
  const registrationReady = selectedCars.length > 0 && selectedCars.every((car) => car.registration?.plateNumber && car.registration?.state);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => {
    let active = true; setQuoteResult(null); setError("");
    const requested = JSON.parse(key) as Selection[];
    if (!requested.length) { setQuoteLoading(false); return; }
    if (!refreshKey && initialQuote && initialQuote.expiresAt > Date.now() && sameSelection(requested, initialQuote.selectedDocuments)) {
      setQuoteResult({ requestKey, quote: initialQuote }); setDate(initialQuote.earliestDeliveryDate); setQuoteLoading(false); return;
    }
    setQuoteLoading(true);
    const timer = window.setTimeout(() => {
      void customerApi<Quote>("checkout/quote", { selection: requested }).then((q) => {
        if (active) { setQuoteResult({ requestKey, quote: q }); setDate((previous) => previous >= q.earliestDeliveryDate ? previous : q.earliestDeliveryDate); }
      }).catch((e) => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setQuoteLoading(false); });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [key, requestKey, refreshKey, initialQuote]);
  useEffect(() => { if (mode !== "details") return; let active = true; setAddressesLoading(true); void savedAddresses().then((items) => { if (!active) return; setAddresses(items); const primary = items.find((a) => a.isPrimary); if (primary) setAddress((current) => current || primary); }).catch((e) => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setAddressesLoading(false); }); return () => { active = false; }; }, [mode]);
  function continueToDetails() {
    if (!quote || !user) return;
    if (quote.expiresAt <= Date.now()) { setRefreshKey((n) => n + 1); return; }
    saveRenewalDraft(user.uid, selection, quote);
    void track("cta_tapped", { screenName: "web_renewal_review", ctaLabel: "Continue to details", documentCount: selection.length });
    router.push("/renew/checkout");
  }
  if (!selection.length) return <aside className="customer-card customer-review-panel"><span className="customer-eyebrow">Your renewal</span><h2>A clear price, before you pay.</h2><p>Select your documents to see the full cost, including delivery.</p><div className="customer-assurance"><LockKeyhole size={16} />Secure payment with Flutterwave</div></aside>;
  if (mode === "review") return <>
    <aside className="customer-card customer-review-panel"><span className="customer-eyebrow">Your renewal</span><h2>Review your price</h2><p className="customer-small">{selection.length} document{selection.length === 1 ? "" : "s"} selected. Delivery is added once.</p>
      {quote ? <PriceBreakdown quote={quote} /> : <div className="customer-quote-placeholder" role="status">{error ? <p role="alert" className="customer-error">{error}</p> : <><span className="customer-spinner" />Updating your price…</>}</div>}
      {error && !quoteLoading && <button className="customer-secondary mb-3" onClick={() => setRefreshKey((n) => n + 1)}>Try again</button>}
      <button className="customer-primary customer-full" disabled={!quote || quoteLoading} onClick={continueToDetails}>Continue to details <ArrowRight size={17} /></button><p className="customer-small customer-summary-note">Next: vehicle details, document copies and delivery. You haven’t paid yet.</p><div className="customer-assurance"><LockKeyhole size={16} />Secure payment with Flutterwave</div>
    </aside><div className="customer-mobile-checkout-bar"><div><span>Total payable</span><strong>{quote ? money(quote.amount) : "Updating…"}</strong></div><button className="customer-primary" disabled={!quote || quoteLoading} onClick={continueToDetails}>Continue <ArrowRight size={16} /></button></div>
  </>;
  return <div className="customer-card customer-checkout-details"><div className="customer-section-title"><span>1</span><div><h2>Vehicle details</h2><p>Check the plate and registration state for each vehicle.</p></div></div>
    {selectedCars.map((car) => <RenewalRegistration key={car.carId} car={car} disabled={busy} onSavingChange={(saving) => setRegistrationSaves((count) => Math.max(0, count + (saving ? 1 : -1)))} onSaved={onRegistrationSaved} />)}
    {error && !quote && <div className="customer-error" role="alert">{error}</div>}
    {!quote ? <><p role="status">{quoteLoading || !error ? "Loading current prices…" : "Your quote could not be loaded."}</p>{!quoteLoading && error && <button className="customer-secondary" onClick={() => setRefreshKey((n) => n + 1)}>Refresh quote</button>}</> : <>
      <section className="customer-section mt-6"><div className="customer-section-title"><span>2</span><div><h2>Document copies</h2><p>Upload clear images so your agent can get started. JPEG, PNG or WebP, up to 8 MB.</p></div></div>
        {!quote.requiredUploads.length && <p className="customer-notice">No document copies are needed for this renewal.</p>}
        {quote.requiredUploads.map((slot) => { const key = `${slot.carId}/${slot.evidenceType}`; const file = files[key]; return <div className="customer-upload-item" key={key}><label className="customer-field"><span>{slot.label} · {slot.carName}</span><input ref={(node) => { uploadInputs.current[key] = node; }} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => {
          const selected = e.target.files?.[0]; if (!selected) return;
          if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || !selected.size || selected.size > 8 * 1024 * 1024) { e.target.value = ""; setFiles((current) => { const next = { ...current }; delete next[key]; return next; }); const message = "Choose a JPEG, PNG or WebP image up to 8 MB."; setFileErrors((current) => ({ ...current, [key]: message })); void track("error_shown", { screenName: "web_checkout", errorCode: "invalid_document_copy", errorMessage: message }); return; }
          setFiles((current) => ({ ...current, [key]: selected })); setFileErrors((current) => ({ ...current, [key]: "" }));
        }} /></label>{file && <div className="customer-upload-selected"><CheckCircle2 size={16} /><span>{file.name}</span><button type="button" disabled={busy} aria-label={`Remove ${slot.label}`} onClick={() => { const input = uploadInputs.current[key]; if (input) input.value = ""; setFiles((current) => { const next = { ...current }; delete next[key]; return next; }); }}><X size={15} />Remove</button></div>}{fileErrors[key] && <p className="customer-error" role="alert">{fileErrors[key]}</p>}</div>; })}
      </section>
      <section className="customer-section"><div className="customer-section-title"><span>3</span><div><h2>Where should we deliver?</h2><p>Choose a saved address or add a new one.</p></div></div>
        <DeliveryAddressPicker addresses={addresses} address={address} confirmed={confirmed} disabled={busy} loading={addressesLoading} onSelect={(value) => { setAddress(value); setError(""); }} onConfirm={setConfirmed} onEditingChange={setAddressEditing} />
        <DeliveryDatePicker min={quote.earliestDeliveryDate} max={new Date(Date.parse(quote.earliestDeliveryDate) + 90 * 86400000).toISOString().slice(0, 10)} value={date} onChange={setDate} disabled={busy} />
      </section>
      <div className="customer-checkout-final"><h2>Your renewal summary</h2><PriceBreakdown quote={quote} />
      <p className="customer-small customer-muted">{registrationSaves ? "Saving your vehicle details…" : !registrationReady ? "Save the plate and registration state for each selected vehicle to continue." : quote.requiredUploads.some((s) => !files[`${s.carId}/${s.evidenceType}`]) ? "Add all required document copies above to continue." : addressEditing ? "Finish choosing your delivery address above to continue." : !confirmed ? "Confirm your delivery address above to continue." : !date ? "Choose your delivery date above to continue." : "Everything is ready. Complete your payment to start the renewal."}</p>
      {error && <div className="customer-error" role="alert">{error}</div>}
      {status && <div role="status" className="customer-notice">{status}</div>}
      <button className="customer-primary customer-full" disabled={busy || registrationSaves > 0 || addressEditing || !confirmed || !registrationReady || !date || quote.requiredUploads.some((s) => !files[`${s.carId}/${s.evidenceType}`])} onClick={async () => {
        if (busy || registrationSaves || addressEditing || !address || !confirmed || !registrationReady) return; setBusy(true); setError("");
        try {
          if (quote.expiresAt <= Date.now()) throw new Error("Your quote has expired. Refresh your price before paying.");
          if (quote.requiredUploads.some((slot) => !files[`${slot.carId}/${slot.evidenceType}`])) throw new Error("Upload all required documents before paying.");
          if (!date || date < quote.earliestDeliveryDate) throw new Error("Choose an available delivery date.");
          setStatus("Saving your confirmed address…"); const saved = await saveAddress(address);
          const uploads: Record<string, Record<string, string>> = {};
          for (const slot of quote.requiredUploads) { setStatus(`Uploading ${slot.label}…`); uploads[slot.carId] ??= {};
            uploads[slot.carId][slot.evidenceType] = await uploadEvidence(files[`${slot.carId}/${slot.evidenceType}`], quote, slot.carId, slot.evidenceType); }
          setStatus("Opening secure payment…");
          void track("renewal_payment_initiated", { carId: selection[0].carId, documentTypes: selection.map((s) => s.documentId), totalAmountNGN: quote.amount });
          const result = await customerApi<{ link: string; txRef: string }>("checkout/start", { quoteToken: quote.quoteToken, addressId: saved.addressId, preferredDeliveryDate: date, uploads });
          const uid = user?.uid;
          if (uid) rememberCheckout(result.txRef, uid);
          window.location.assign(result.link);
        } catch (e) { setError(errorMessage(e)); setStatus(""); setBusy(false); void track("error_shown", { screenName: "web_checkout", errorCode: "checkout_failed", errorMessage: errorMessage(e) }); }
      }}>{busy ? status || "Please wait…" : <>Pay {money(quote.amount)} <ArrowRight size={17} /></>}</button>
      <p className="customer-small text-center mt-3"><LockKeyhole size={13} className="inline mr-1" />Pay securely with Flutterwave, then return here to track your renewal.</p>
      <button disabled={busy} className="customer-link customer-small" onClick={() => setRefreshKey((n) => n + 1)}>Refresh prices</button>
      </div>
    </>}
  </div>;
}
