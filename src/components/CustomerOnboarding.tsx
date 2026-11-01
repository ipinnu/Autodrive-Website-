"use client";
import { useEffect, useState } from "react";
import { BellRing, CarFront, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCustomer } from "./CustomerProvider";
import { BRANDS, DOCUMENTS, STATES, errorMessage, lookupVehicle, saveVehicle, skipOnboarding, track, type LookupResult } from "@/lib/customer";

const screens = ["buyer_onboarding_welcome", "buyer_onboarding_car_brand", "buyer_onboarding_car_details", "buyer_onboarding_documents", "buyer_onboarding_smart_reminders", "buyer_onboarding_registration_details"];
export default function CustomerOnboarding({ additional = false }: { additional?: boolean }) {
  const { profile } = useCustomer(); const router = useRouter();
  const [step, setStep] = useState(0); const [make, setMake] = useState(""); const [model, setModel] = useState("");
  const [year, setYear] = useState(""); const [type, setType] = useState("Salon"); const [plate, setPlate] = useState(""); const [state, setState] = useState("");
  const [documents, setDocuments] = useState<string[]>(DOCUMENTS.slice(0, 3)); const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [search, setSearch] = useState(""); const [custom, setCustom] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { void track("screen_viewed", { screenName: screens[step], previousScreen: step ? screens[step - 1] : "RegistrationScreen", timeOnPreviousScreenMs: 0 }); }, [step]);
  function next() { setError(""); void track("cta_tapped", { screenName: screens[step], ctaLabel: "Continue" }); setStep((n) => n + 1); }
  async function finish(skip = false) {
    if (busy) return;
    if (!skip && (!plate.trim() || !state)) { setError("Add your plate and registration state, or choose ‘I’ll do this later’."); return; }
    setBusy(true); setError("");
    try {
      await saveVehicle({ make, model, year: Number(year), type, plate, state, documents,
        expiries: Object.fromEntries((lookup?.documents || []).map((d) => [d.type, d.expiryDate])), lookup, onboarding: !additional });
      router.replace("/renew");
    } catch (e) { setError(errorMessage(e)); setBusy(false); }
  }
  return <div className="customer-main" style={{ maxWidth: 740 }}><div className="customer-step"><span>{additional ? "Add another vehicle" : "Build your garage"}</span><button className="customer-link" disabled={busy} onClick={async () => { try { if (!additional) await skipOnboarding(); router.replace("/renew"); } catch (e) { setError(errorMessage(e)); } }}>Skip for now</button><span>Step {step + 1} of 6</span></div>
    <div className="customer-progress"><span style={{ width: `${(step + 1) / 6 * 100}%` }} /></div><div className="customer-card">
      {step === 0 && <><CarFront size={38} className="text-gold mb-5" /><h1>{additional ? "Add your next vehicle" : `Welcome${profile?.firstName ? `, ${profile.firstName}` : ""}.`}</h1><p>Let’s add your vehicle and the documents you want AutoDrive to help you manage.</p>
        <form onSubmit={async (e) => { e.preventDefault(); if (busy) return; setBusy(true); setError(""); setLookup(null);
          try { setLookup(await lookupVehicle(plate.trim())); void track("cta_tapped", { screenName: screens[0], ctaLabel: "Look up licence plate" }); }
          catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
        }}><label className="customer-field"><span>Find your vehicle by licence plate</span><input required maxLength={24} value={plate} onChange={(e) => { setPlate(e.target.value.toUpperCase()); setLookup(null); }} placeholder="ABC123DE" /></label>
          <button className="customer-primary customer-full" type="submit" disabled={busy}><Search size={17} />{busy ? "Checking your plate…" : "Find my vehicle"}</button></form>
        {lookup && <div className="customer-lookup-card"><h3>{lookup.make} {lookup.model}</h3><strong>{lookup.plateNumber}</strong><p className="customer-small">Check that these details match your vehicle.</p>
          <ul className="customer-small mb-5">{lookup.documents.map((d) => <li key={d.type}>{d.type}: {d.expiryDate}</li>)}</ul>
          <button className="customer-primary" onClick={() => { setMake(lookup.make); setModel(lookup.model); setType(lookup.appVehicleType); setPlate(lookup.plateNumber); setDocuments(lookup.documents.length ? lookup.documents.map((d) => d.type) : DOCUMENTS.slice(0, 3)); setStep(2); setError(""); }}>Yes, this is my vehicle</button></div>}
        <div className="customer-divider">or</div><button disabled={busy} className="customer-secondary customer-full" onClick={() => { setLookup(null); setMake(""); setModel(""); setStep(1); setError(""); }}>Enter vehicle details manually</button>
      </>}
      {step === 1 && <><h1>Choose your car brand</h1><p>Select the manufacturer of your vehicle.</p><label className="customer-field"><span>Search brands</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Toyota, Honda, Lexus…" /></label>
        <div className="customer-brand-scroll"><div className="customer-brands">{BRANDS.filter(([name]) => name.toLowerCase().includes(search.toLowerCase())).map(([name, logo]) => <button className="customer-brand" key={name} onClick={() => { setMake(name); setCustom(false); next(); }}><img src={`/images/customer/brands/${logo}`} alt={`${name} logo`} loading="lazy" /><span>{name}</span></button>)}</div></div>
        <button className="customer-link customer-small mt-5" onClick={() => { setMake(""); setCustom(true); next(); }}>I don’t see my brand</button></>}
      {step === 2 && <><h1>Tell us about your vehicle</h1><p>A few details help us keep the right documents together.</p><form onSubmit={(e) => { e.preventDefault(); if (!make.trim() || !model.trim() || Number(year) < 1950 || Number(year) > new Date().getFullYear() + 1) { setError("Check your make, model and year."); return; } next(); }}>
        <label className="customer-field"><span>Make</span><input required value={make} readOnly={!custom && !lookup} onChange={(e) => setMake(e.target.value)} /></label>
        <div className="customer-row"><label className="customer-field"><span>Model</span><input required value={model} onChange={(e) => setModel(e.target.value)} placeholder="Corolla" /></label><label className="customer-field"><span>Year</span><input required inputMode="numeric" type="number" min={1950} max={new Date().getFullYear() + 1} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2018" /></label></div>
        <label className="customer-field"><span>Car type</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="Salon">Salon</option><option value="Jeep">Jeep / SUV</option></select></label><button className="customer-primary customer-full" type="submit">Continue</button></form></>}
      {step === 3 && <><h1>Choose documents to track</h1><p>Select the documents you want to manage for {make} {model}.</p>{DOCUMENTS.map((document) => <label className="customer-checkbox" key={document}><input type="checkbox" checked={documents.includes(document)} onChange={(e) => setDocuments((current) => e.target.checked ? [...current, document] : current.filter((d) => d !== document))} /><span>{document}</span><span className="customer-small customer-muted ml-auto">{lookup?.documents.find((d) => d.type === document)?.expiryDate}</span></label>)}<button className="customer-primary customer-full mt-5" onClick={() => documents.length ? next() : setError("Choose at least one document to track.")}>Continue</button></>}
      {step === 4 && <><BellRing size={46} className="text-gold mb-5" /><h1>We’ll help you stay ahead of renewals.</h1><p>You can add expiry dates or start a renewal later from your garage. Dates found by the plate check will be saved with your documents.</p><div className="customer-notice">Your documents stay connected to the same AutoDrive account on the app and website.</div><button className="customer-primary customer-full mt-5" onClick={next}>Continue to registration details</button></>}
      {step === 5 && <><h1>Add registration details</h1><p>Your plate number and registration state help your assigned agent process the right documents.</p><form onSubmit={(e) => { e.preventDefault(); void finish(); }}>
        <label className="customer-field"><span>Plate number</span><input value={plate} maxLength={24} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="ABC123DE" /></label><label className="customer-field"><span>Registration state</span><select value={state} onChange={(e) => setState(e.target.value)}><option value="">Choose state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <button disabled={busy} className="customer-primary customer-full" type="submit">{busy ? "Saving your vehicle…" : "Save and open my garage"}</button></form><button className="customer-link customer-small mt-5" disabled={busy} onClick={() => void finish(true)}>I’ll do this later</button></>}
      {error && <div className="customer-error" role="alert">{error}</div>}{step > 0 && <button className="customer-link customer-small mt-5" disabled={busy} onClick={() => { setStep((n) => n === 2 && lookup ? 0 : n - 1); setError(""); }}>← Back</button>}
    </div></div>;
}
