"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import { searchAddresses, type Address } from "@/lib/customer-checkout";
import { errorMessage, track } from "@/lib/customer";

const blankAddress = (): Address => ({ addressLine: "", city: "", state: "", postcode: "", formatted: "" });
export default function DeliveryAddressPicker({ addresses, address, confirmed, disabled, loading = false, onSelect, onConfirm, onEditingChange }: {
  addresses: Address[]; address: Address | null; confirmed: boolean; disabled: boolean; loading?: boolean;
  onSelect: (address: Address | null) => void; onConfirm: (confirmed: boolean) => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [changing, setChanging] = useState(false); const [query, setQuery] = useState("");
  const [results, setResults] = useState<Address[]>([]); const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false); const [manual, setManual] = useState(false);
  const [draft, setDraft] = useState<Address>(blankAddress); const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1); const [listOpen, setListOpen] = useState(true);
  const [retry, setRetry] = useState(0);
  const field = useRef<HTMLInputElement>(null); const id = useId();
  const showEditor = !address || changing; const normalizedQuery = query.trim().replace(/\s+/g, " ");
  useEffect(() => { onEditingChange?.(showEditor && !loading); }, [showEditor, loading, onEditingChange]);
  useEffect(() => { if (changing) field.current?.focus(); }, [changing]);
  useEffect(() => {
    setResults([]); setSearched(false); setError(""); setActiveIndex(-1);
    if (!showEditor || manual || disabled || loading || normalizedQuery.length < 3) { setSearching(false); return; }
    let active = true; const controller = new AbortController(); setSearching(true); setListOpen(true);
    const timeout = window.setTimeout(() => controller.abort(), 18000);
    const debounce = window.setTimeout(() => {
      void searchAddresses(normalizedQuery, controller.signal).then((items) => {
        if (active) { setResults(items); setSearched(true); }
      }).catch((e) => {
        if (!active) return;
        const message = controller.signal.aborted ? "Address search took too long. Try again or enter your address manually." : errorMessage(e);
        setError(message); void track("error_shown", { screenName: "checkout_address_confirmation", errorCode: "address_search_failed", errorMessage: message });
      }).finally(() => { if (active) setSearching(false); });
    }, 500);
    return () => { active = false; window.clearTimeout(debounce); window.clearTimeout(timeout); controller.abort(); };
  }, [normalizedQuery, showEditor, manual, disabled, loading, retry]);
  function select(value: Address) {
    onSelect(value); onConfirm(false); setChanging(false); setQuery(""); setResults([]); setSearched(false); setManual(false); setError("");
    void track("cta_tapped", { screenName: "checkout_address_confirmation", ctaLabel: "Select delivery address" });
  }
  function cancelChange() { setChanging(false); setQuery(""); setManual(false); setResults([]); setError(""); }
  function toggleManual() {
    setError(""); if (manual) { setManual(false); return; }
    setDraft(address ? { addressLine: address.addressLine, city: address.city, state: address.state, postcode: address.postcode || "", formatted: address.formatted } : blankAddress());
    setManual(true); void track("cta_tapped", { screenName: "checkout_address_confirmation", ctaLabel: "Enter address manually" });
  }
  const complete = Boolean(address?.addressLine?.trim() && address.city?.trim() && address.state?.trim());
  const showResults = listOpen && results.length > 0;
  if (loading) return <p role="status" className="customer-small"><span className="customer-spinner" /> Loading your saved addresses…</p>;
  return <div className="customer-address-picker">
    {address && <div className="customer-selected-address"><div className="customer-address-summary"><MapPin size={20} /><div><strong>Deliver to</strong><p>{address.formatted}</p></div>
      {!changing && <button type="button" className="customer-link customer-small" disabled={disabled} aria-expanded={false} onClick={() => { setChanging(true); void track("cta_tapped", { screenName: "checkout_address_confirmation", ctaLabel: "Change address" }); }}>Change address</button>}
    </div>
      {!complete && !changing && <p className="customer-small">Choose “Change address” to add the street, city and state.</p>}
      {!changing && <label className="customer-checkbox customer-delivery-confirmation"><span>This is the correct delivery address.</span><input type="checkbox" disabled={disabled || !complete} checked={confirmed} onChange={(e) => onConfirm(e.target.checked)} /></label>}
    </div>}
    {showEditor && <div className="customer-address-editor">
      <div className="customer-address-editor-title"><strong>{address ? "Change address" : "Find your delivery address"}</strong>{address && <button type="button" className="customer-link customer-small" disabled={disabled} onClick={cancelChange}><X size={14} />Cancel</button>}</div>
      {addresses.some((saved) => saved.addressId !== address?.addressId) && <label className="customer-field"><span>Use a saved address</span><select disabled={disabled} value="" onChange={(e) => { const saved = addresses.find((a) => a.addressId === e.target.value); if (saved) select(saved); }}><option value="">Choose a saved address</option>{addresses.map((saved) => <option value={saved.addressId} key={saved.addressId}>{saved.formatted}</option>)}</select></label>}
      {!manual && <div className="customer-live-address"><label className="customer-field"><span id={`${id}-label`}>{address ? "Search for a different address" : "Street or area and city"}</span><div className="customer-address-input"><Search size={18} /><input ref={field} role="combobox" aria-labelledby={`${id}-label`} aria-autocomplete="list" aria-expanded={showResults} aria-controls={`${id}-results`} aria-activedescendant={showResults && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} maxLength={180} disabled={disabled} autoComplete="off" value={query} onFocus={() => setListOpen(true)} onChange={(e) => { setQuery(e.target.value); setResults([]); setSearched(false); setActiveIndex(-1); setListOpen(true); }} onKeyDown={(e) => {
        if (e.key === "ArrowDown" && results.length) { e.preventDefault(); setListOpen(true); setActiveIndex((n) => Math.min(n + 1, results.length - 1)); }
        else if (e.key === "ArrowUp" && results.length) { e.preventDefault(); setActiveIndex((n) => Math.max(n - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); if (showResults) select(results[activeIndex >= 0 ? activeIndex : 0]); }
        else if (e.key === "Escape") { e.preventDefault(); setListOpen(false); setActiveIndex(-1); }
      }} placeholder="Start typing, e.g. Allen Avenue, Ikeja" />{searching && <span className="customer-spinner" aria-hidden="true" />}</div></label>
        {query && normalizedQuery.length < 3 && <p className="customer-small customer-muted">Type at least 3 characters to see matching addresses.</p>}
        {searching && <p role="status" className="customer-small">Finding matching addresses…</p>}
        {!searching && searched && !results.length && <p className="customer-notice" role="status">No matches yet. Add a nearby area or city, or enter the address manually.</p>}
        {showResults && <div id={`${id}-results`} role="listbox" aria-label="Matching addresses" className="customer-address-results">{results.map((result, i) => <button type="button" role="option" aria-selected={activeIndex === i} id={`${id}-option-${i}`} className={activeIndex === i ? "is-active" : ""} disabled={disabled} key={`${result.latitude}/${result.longitude}/${i}`} onClick={() => select(result)}><MapPin size={18} /><span>{result.formatted}</span>{activeIndex === i && <Check size={16} />}</button>)}</div>}
        <p className="customer-small customer-muted mt-3">Suggestions by Photon · <a className="customer-link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.</p>
      </div>}
      {error && <div className="customer-error" role="alert">{error}{!manual && normalizedQuery.length >= 3 && <button type="button" className="customer-link customer-small ml-2" disabled={disabled || searching} onClick={() => setRetry((n) => n + 1)}>Try again</button>}</div>}
      <button type="button" className="customer-manual-toggle" disabled={disabled} aria-expanded={manual} aria-controls={`${id}-manual`} onClick={toggleManual}><span>{manual ? "Back to address suggestions" : "Enter address manually"}</span><ChevronDown size={17} className={manual ? "is-open" : ""} /></button>
      {manual && <form id={`${id}-manual`} className="customer-lookup-card" onSubmit={(e) => {
        e.preventDefault(); if (disabled) return;
        if (!draft.addressLine.trim() || !draft.city.trim() || !draft.state.trim()) { setError("Add the street, city and state for delivery."); return; }
        const value = { ...draft, addressLine: draft.addressLine.trim(), city: draft.city.trim(), state: draft.state.trim(), postcode: draft.postcode.trim() };
        const existing = addresses.find((saved) => ["addressLine", "city", "state", "postcode"].every((field) => String(saved[field as keyof Address] || "").trim().toLowerCase() === String(value[field as keyof Address] || "").trim().toLowerCase()));
        select(existing || { ...value, formatted: [value.addressLine, value.city, value.state, value.postcode].filter(Boolean).join(", ") });
      }}>
        <label className="customer-field"><span>Street / house number</span><input required disabled={disabled} autoComplete="street-address" value={draft.addressLine} onChange={(e) => setDraft({ ...draft, addressLine: e.target.value })} placeholder="House number and street" /></label>
        <div className="customer-row"><label className="customer-field"><span>City / area</span><input required disabled={disabled} autoComplete="address-level2" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label><label className="customer-field"><span>State</span><input required disabled={disabled} autoComplete="address-level1" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} /></label></div>
        <div className="flex flex-wrap gap-3"><button className="customer-primary" disabled={disabled}>Use this address</button><button type="button" className="customer-secondary" disabled={disabled} onClick={() => { setManual(false); setError(""); }}>Cancel</button></div>
      </form>}
    </div>}
  </div>;
}
