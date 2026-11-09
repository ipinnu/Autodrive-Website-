"use client";

import { useEffect, useState } from "react";
import { doc, runTransaction } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomer } from "./CustomerProvider";
import { customerApi } from "@/lib/customer-checkout";
import { client, loadVehicles, errorMessage, track, type Vehicle } from "@/lib/customer";
import { saveRenewalDraft } from "@/lib/renewal-draft";
import VehicleIcon from "./VehicleIcon";

export default function WhatsAppRenewal() {
  const { user } = useCustomer();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [car, setCar] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    let code = window.location.hash.slice(1);
    try { code ||= sessionStorage.getItem("autodrive-whatsapp-handoff") || ""; } catch {}
    if (!code || !/^[a-f0-9]{64}$/.test(code)) {
      setError("Open the latest selection link in your WhatsApp conversation.");
      return;
    }
    setLoading(true);
    setError("");
    void Promise.all([
      customerApi<{ documents: string[]; carType: string }>("whatsapp/claim", { code }),
      loadVehicles(user.uid),
    ]).then(([selection, cars]) => {
      if (!active) return;
      setDocuments(selection.documents);
      setVehicles(cars.filter((vehicle) => vehicle.type === selection.carType));
    }).catch((failure) => { if (active) setError(errorMessage(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, retry]);

  return <div className="customer-main">
    <div className="customer-card customer-narrow">
      <span className="customer-eyebrow">From WhatsApp to AutoDrive</span>
      <h1>Your renewal, ready to continue.</h1>
      {!user ? <>
        <p>Your document choices will follow you. Sign in or create an account to choose your vehicle, review the final price and proceed to payment.</p>
        <div className="customer-actions">
          <Link className="customer-primary" href="/renew/sign-up">Create account</Link>
          <Link className="customer-secondary" href="/renew/sign-in">Sign in</Link>
        </div>
      </> : loading ? <p role="status">Loading your selections and vehicles…</p> : <>
        {documents.length > 0 && <p>{documents.join(" · ")}</p>}
        {vehicles.length > 0 && <fieldset>
          <legend>Which vehicle are we renewing?</legend>
          {vehicles.map((vehicle) => <label key={vehicle.carId} className="customer-checkbox">
            <input type="radio" name="whatsapp-car" value={vehicle.carId} checked={car === vehicle.carId} onChange={() => setCar(vehicle.carId)} />
            <VehicleIcon make={vehicle.make} /><span>{vehicle.name}</span>
          </label>)}
        </fieldset>}
        {documents.length > 0 && !vehicles.length && <p>Add a vehicle in the category you selected on WhatsApp to continue.</p>}
        {documents.length > 0 && <p className="customer-small">Selected documents not yet in your garage will be added without an expiry date.</p>}
        {documents.length > 0 && <div className="customer-actions">
          <button className="customer-primary" disabled={!car || saving} onClick={async () => {
            const vehicle = vehicles.find((item) => item.carId === car);
            if (!vehicle) return;
            setSaving(true);
            setError("");
            try {
              const selected = documents.map((documentType) => ({
                carId: car, documentId: vehicle.documents.find((item) => item.type === documentType)?.id || documentType,
              }));
              // Read before writing, preserving expiry dates saved by another tab or device.
              const db = client().db;
              await runTransaction(db, async (transaction) => {
                const refs = selected.map((item) => doc(db, "cars", user.uid, "carDetails", car, "documents", item.documentId));
                const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
                snapshots.forEach((snapshot, index) => {
                  if (!snapshot.exists()) transaction.set(refs[index], {
                    type: documents[index], expiration: "Not Set", expirationDate: "Not Set",
                  });
                });
              });
              saveRenewalDraft(user.uid, selected);
            try { sessionStorage.removeItem("autodrive-whatsapp-handoff"); } catch {}
            void track("cta_tapped", { screenName: "web_whatsapp_handoff", ctaLabel: "Review renewal" });
              router.replace("/renew/orders");
            } catch (failure) {
              setError(errorMessage(failure));
            } finally {
              setSaving(false);
            }
          }}>Review renewal</button>
          <Link className="customer-secondary" href="/renew/add-vehicle">Add vehicle</Link>
        </div>}
      </>}
      {error && <div role="alert" className="customer-error"><p>{error}</p>{user && <button type="button" className="customer-secondary" onClick={() => setRetry((value) => value + 1)}>Try again</button>} <Link href="/renew" className="customer-link" onClick={() => { try { sessionStorage.removeItem("autodrive-whatsapp-handoff"); } catch {} }}>Open my garage</Link></div>}
    </div>
  </div>;
}
