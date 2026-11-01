"use client";
import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { customerApi, money, savedAddresses, saveAddress, searchAddresses, uploadEvidence, type Address, type Quote, type Selection } from "@/lib/customer-checkout";
import { errorMessage, track } from "@/lib/customer";

export default function CustomerCheckout({ selection, onBusyChange }: { selection: Selection[]; onBusyChange?: (busy: boolean) => void }) {
  const [quote, setQuote] = useState<Quote | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<Record<string, File>>({}); const [addresses, setAddresses] = useState<Address[]>([]); const [address, setAddress] = useState<Address | null>(null);
  const [confirmed, setConfirmed] = useState(false); const [search, setSearch] = useState(""); const [results, setResults] = useState<Address[]>([]); const [date, setDate] = useState("");
  const [status, setStatus] = useState(""); const [refreshKey, setRefreshKey] = useState(0);
  const key = JSON.stringify(selection);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => {
    let active = true; setQuote(null); setError(""); setFiles({}); setDate("");
    const requested = JSON.parse(key) as Selection[];
    if (!requested.length) { setBusy(false); return; }
    setBusy(true);
    void customerApi<Quote>("checkout/quote", { selection: requested }).then((q) => { if (active) { setQuote(q); setDate(q.earliestDeliveryDate); } })
      .catch((e) => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [key, refreshKey]);
  useEffect(() => { void savedAddresses().then((items) => { setAddresses(items); const primary = items.find((a) => a.isPrimary); if (primary) setAddress(primary); }).catch((e) => setError(errorMessage(e))); }, []);
  if (!selection.length) return null;
  return <div className="customer-card mt-6"><h2>Review your renewal</h2><p>Pay securely through Flutterwave. Your assigned agent receives your order once payment is confirmed.</p>
    {error && <div className="customer-error" role="alert">{error}</div>}
    {!quote ? <><p role="status">{busy ? "Loading current prices…" : "Your quote could not be loaded."}</p>{!busy && <button className="customer-secondary" onClick={() => setRefreshKey((n) => n + 1)}>Refresh quote</button>}</> : <>
      <div className="customer-table-wrap"><table><thead><tr><th>Vehicle / document</th><th>Price</th></tr></thead><tbody>{quote.selectedDocuments.map((d) => <tr key={`${d.carId}/${d.documentId}`}><td><strong>{d.documentId}</strong><span className="customer-small customer-muted">{d.car}</span></td><td>{money(d.customerPriceNGN)}</td></tr>)}<tr><td>Delivery</td><td>{money(quote.logisticsFeeNGN)}</td></tr><tr><td><strong>Total payable</strong></td><td><strong>{money(quote.amount)}</strong></td></tr></tbody></table></div>
      <section className="customer-section mt-6"><h3>Required documents</h3><p className="customer-small">Upload a clear image for each item. JPEG, PNG or WebP, up to 8 MB.</p>
        {quote.requiredUploads.map((slot) => <label className="customer-field" key={`${slot.carId}/${slot.evidenceType}`}><span>{slot.label} · {slot.carName}</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) setFiles((current) => ({ ...current, [`${slot.carId}/${slot.evidenceType}`]: file })); }} /></label>)}
      </section>
      <section className="customer-section"><h3>Delivery address</h3>
        {addresses.length > 0 && <label className="customer-field"><span>Saved addresses</span><select value={address?.addressId || ""} onChange={(e) => { setAddress(addresses.find((a) => a.addressId === e.target.value) || null); setConfirmed(false); }}><option value="">Find another address</option>{addresses.map((a) => <option value={a.addressId} key={a.addressId}>{a.formatted}</option>)}</select></label>}
        <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(""); try { setResults(await searchAddresses(search)); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }}><label className="customer-field"><span>Search for your address</span><input minLength={3} required value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Street, area and city" /></label><button className="customer-secondary" disabled={busy}>Search address</button></form>
        {results.map((a, i) => <button className="customer-secondary w-full text-left mt-2" key={i} onClick={() => { setAddress(a); setConfirmed(false); setResults([]); }}>{a.formatted}</button>)}
        <p className="customer-small mt-3">Address lookup © <a className="customer-link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
        {address && <div className="customer-lookup-card"><div className="customer-row"><label className="customer-field"><span>Street / house number</span><input value={address.addressLine} onChange={(e) => { setAddress({ ...address, addressLine: e.target.value }); setConfirmed(false); }} /></label><label className="customer-field"><span>City / area</span><input value={address.city} onChange={(e) => { setAddress({ ...address, city: e.target.value }); setConfirmed(false); }} /></label></div><label className="customer-field"><span>State</span><input value={address.state} onChange={(e) => { setAddress({ ...address, state: e.target.value }); setConfirmed(false); }} /></label><label className="customer-checkbox"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />I confirm this is the correct delivery address.</label></div>}
        <label className="customer-field"><span>Preferred delivery date</span><input type="date" min={quote.earliestDeliveryDate} value={date} onChange={(e) => setDate(e.target.value)} disabled={busy} /></label>
      </section>
      {status && <div role="status" className="customer-notice">{status}</div>}
      <button className="customer-primary customer-full" disabled={busy || !confirmed} onClick={async () => {
        if (busy || !address || !confirmed) return; setBusy(true); setError("");
        try {
          if (quote.requiredUploads.some((slot) => !files[`${slot.carId}/${slot.evidenceType}`])) throw new Error("Upload all required documents before paying.");
          if (!date || date < quote.earliestDeliveryDate) throw new Error("Choose an available delivery date.");
          setStatus("Saving your confirmed address…"); const saved = await saveAddress(address);
          const uploads: Record<string, Record<string, string>> = {};
          for (const slot of quote.requiredUploads) { setStatus(`Uploading ${slot.label}…`); uploads[slot.carId] ??= {};
            uploads[slot.carId][slot.evidenceType] = await uploadEvidence(files[`${slot.carId}/${slot.evidenceType}`], quote, slot.carId, slot.evidenceType); }
          setStatus("Opening secure payment…");
          await track("renewal_payment_initiated", { carId: selection[0].carId, documentTypes: selection.map((s) => s.documentId), totalAmountNGN: quote.amount });
          const result = await customerApi<{ link: string; txRef: string }>("checkout/start", { quoteToken: quote.quoteToken, addressId: saved.addressId, preferredDeliveryDate: date, uploads });
          sessionStorage.setItem(`autodrive-web-payment-${result.txRef}`, String(quote.amount)); window.location.assign(result.link);
        } catch (e) { setError(errorMessage(e)); setStatus(""); setBusy(false); void track("error_shown", { screenName: "web_checkout", errorCode: "checkout_failed", errorMessage: errorMessage(e) }); }
      }}>{busy ? status || "Please wait…" : <>Pay {money(quote.amount)} <ArrowRight size={17} /></>}</button>
      <p className="customer-small text-center mt-3"><LockKeyhole size={13} className="inline mr-1" />Confirmation may take a moment after you return from Flutterwave.</p>
      <button disabled={busy} className="customer-link customer-small" onClick={() => setRefreshKey((n) => n + 1)}>Refresh prices</button>
    </>}
  </div>;
}
