"use client";
import { useState } from "react";
import VehicleIcon from "./VehicleIcon";
import { errorMessage, saveRegistration, STATES, track, type Vehicle } from "@/lib/customer";

export default function RenewalRegistration({ car, disabled, onSaved, onSavingChange }: {
  car: Vehicle; disabled: boolean; onSaved: (carId: string, plate: string, state: string) => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const missing = !car.registration?.plateNumber || !car.registration?.state;
  const [editing, setEditing] = useState(false);
  const [plate, setPlate] = useState(car.registration?.plateNumber || "");
  const [state, setState] = useState(car.registration?.state || "");
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  return <section className="customer-section">
    <div className="flex items-center gap-3"><VehicleIcon make={car.make} /><div className="flex-1"><h3>{car.name}</h3><p className="customer-small mb-0">{car.registration?.plateNumber || "Plate not added"} · {car.registration?.state || "State not added"}</p></div>
      {!missing && !editing && <button type="button" disabled={disabled} className="customer-secondary customer-small" onClick={() => { setPlate(car.registration?.plateNumber || ""); setState(car.registration?.state || ""); setEditing(true); void track("cta_tapped", { screenName: "web_checkout", ctaLabel: "Edit registration details", carId: car.carId }); }}>Edit details</button>}
    </div>
    {(missing || editing) && <form className="mt-4" onSubmit={async (e) => {
      e.preventDefault(); if (saving || disabled) return; setSaving(true); onSavingChange(true); setError("");
      try { await saveRegistration(car.carId, plate, state); onSaved(car.carId, plate.toUpperCase().replace(/[^A-Z0-9]/g, ""), state); setEditing(false); }
      catch (e) { setError(errorMessage(e)); void track("error_shown", { screenName: "web_checkout", errorCode: "registration_save_failed", errorMessage: errorMessage(e) }); }
      finally { setSaving(false); onSavingChange(false); }
    }}>
      {missing && <p className="customer-small">Add this vehicle’s plate number and registration state to continue.</p>}
      <div className="customer-row"><label className="customer-field"><span>Plate number</span><input required disabled={saving || disabled} value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} /></label>
        <label className="customer-field"><span>Registration state</span><select required disabled={saving || disabled} value={state} onChange={(e) => setState(e.target.value)}><option value="">Choose state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label></div>
      {error && <div className="customer-error" role="alert">{error}</div>}
      <div className="flex gap-3"><button className="customer-primary customer-small" disabled={saving || disabled}>{saving ? "Saving…" : "Save registration details"}</button>{!missing && <button type="button" className="customer-secondary customer-small" disabled={saving || disabled} onClick={() => setEditing(false)}>Cancel</button>}</div>
    </form>}
  </section>;
}
