"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCustomer } from "./CustomerProvider";
import CustomerCheckout from "./CustomerCheckout";
import RenewalSteps from "./RenewalSteps";
import { errorMessage, loadVehicles, type Vehicle } from "@/lib/customer";
import { readRenewalDraft } from "@/lib/renewal-draft";
import type { Quote, Selection } from "@/lib/customer-checkout";

export default function CustomerCheckoutPage() {
  const { user } = useCustomer();
  const [draft, setDraft] = useState<{ selection: Selection[]; quote?: Quote } | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!user) return; let active = true; const saved = readRenewalDraft(user.uid); setDraft(saved);
    void loadVehicles(user.uid).then((cars) => { if (active) { setVehicles(cars); setLoaded(true); } })
      .catch((e) => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, [user]);
  return <div className="customer-main"><Link className="customer-back" href="/renew/orders"><ArrowLeft size={16} />Back to price review</Link><RenewalSteps step={2} />
    <div className="customer-heading"><div><span className="customer-eyebrow">Nearly there</span><h1>Let’s get your papers moving.</h1><p>Confirm your vehicle details, add the required copies and choose where we should deliver.</p></div></div>
    {error ? <div className="customer-card"><p role="alert" className="customer-error">{error}</p><Link href="/renew/orders" className="customer-secondary">Return to your renewal</Link></div>
      : !draft || !loaded ? <div className="customer-card" role="status">Preparing your renewal…</div>
      : !draft.selection.length || draft.selection.some((s) => !vehicles.some((c) => c.carId === s.carId && c.documents.some((d) => d.id === s.documentId)))
        ? <div className="customer-card customer-empty"><h2>Choose your documents first</h2><p>Select the papers you want to renew, then review your price.</p><Link className="customer-primary" href="/renew/orders">Choose documents</Link></div>
        : <CustomerCheckout mode="details" selection={draft.selection} initialQuote={draft.quote} vehicles={vehicles} onRegistrationSaved={(carId, plateNumber, state) => setVehicles((cars) => cars.map((car) => car.carId === carId ? { ...car, registration: { ...car.registration, plateNumber, state } } : car))} />}
  </div>;
}
