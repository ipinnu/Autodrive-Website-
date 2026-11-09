"use client";
import { readCheckout, validCheckoutRef } from "@/lib/checkout-recovery";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where, type DocumentData } from "firebase/firestore";
import { Check, CircleCheck, Clock3, FileCheck2, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useCustomer } from "./CustomerProvider";
import CustomerCheckout from "./CustomerCheckout";
import VehicleIcon from "./VehicleIcon";
import RenewalSteps from "./RenewalSteps";
import { readRenewalDraft, saveRenewalDraft } from "@/lib/renewal-draft";
import { client, errorMessage, expiryStatus, loadVehicles, track, type Vehicle } from "@/lib/customer";
import { customerApi, money, type Quote, type Selection } from "@/lib/customer-checkout";

export default function CustomerOrders() {
  const { user, profile } = useCustomer(); const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState(""); const [orders, setOrders] = useState<Record<string, DocumentData[]>>({}); const [tab, setTab] = useState("renew");
  const [paymentReturn, setPaymentReturn] = useState<string>(); const [orderReadFailed, setOrderReadFailed] = useState(false); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(true); const [initialQuote, setInitialQuote] = useState<Quote | undefined>();
  useEffect(() => {
    if (!user) return; const uid = user.uid; let active = true;
    const params = new URLSearchParams(window.location.search); const carId = params.get("car");
    if (params.get("tab") === "ongoing") setTab("ongoing");
    const reference = params.get("tx_ref") || (params.get("tab") ? undefined : readCheckout(uid, true));
    if (validCheckoutRef(reference)) { if (readCheckout(uid) === reference) readCheckout(uid, true); setPaymentReturn(reference); setTab("ongoing"); }
    void loadVehicles(uid).then((cars) => {
      if (!active) return; setVehicles(cars); const saved = readRenewalDraft(uid);
      const available = new Set(cars.flatMap((c) => c.documents.map((d) => `${c.carId}/${d.id}`)));
      setSelected(carId ? cars.filter((c) => c.carId === carId).flatMap((c) => c.documents.map((d) => `${c.carId}/${d.id}`)) : saved.selection.map((s) => `${s.carId}/${s.documentId}`).filter((s) => available.has(s)));
      if (validCheckoutRef(reference)) saveRenewalDraft(uid, saved.selection);
      setInitialQuote(validCheckoutRef(reference) ? undefined : saved.quote); setVehicleLoading(false);
    }).catch((e) => { if (active) { setError(errorMessage(e)); setVehicleLoading(false); } });
    const loaded = new Set<string>();
    const stops = ["PendingOrders", "Orders", "CompletedOrders"].map((name) => onSnapshot(query(collection(client().db, name), where("uid", "==", uid)), (snapshot) => {
      if (!active) return; const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id, collection: name }));
      setOrders((current) => ({ ...current, [name]: items })); loaded.add(name); if (loaded.size === 3) setLoading(false);
    }, () => { if (active) { setOrderReadFailed(true); setLoading(false); } }));
    return () => { active = false; stops.forEach((stop) => stop()); };
  }, [user]);
  const all = useMemo(() => Array.from(new Map(["PendingOrders", "Orders", "CompletedOrders"].flatMap((name) => (orders[name] || []).map((order) => [order.id, order] as const))).values()).sort((a, b) => {
    const time = (v: unknown) => v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : Date.parse(String(v)) || 0;
    return time(b.createdAt) - time(a.createdAt);
  }), [orders]);
  const selectedDocs: Selection[] = selected.map((value) => { const [carId, documentId] = value.split("/"); return { carId, documentId }; });
  function selectDocument(value: string, checked: boolean) {
    const next = checked ? [...selected, value] : selected.filter((s) => s !== value); setSelected(next);
    if (user) saveRenewalDraft(user.uid, next.map((s) => { const [carId, documentId] = s.split("/"); return { carId, documentId }; }));
  }
  const returnRef = paymentReturn;
  const returnOrder = all.find((order) => order.id === returnRef && order.uid === user?.uid);
  const approved = returnOrder?.paymentVerified === true && returnOrder?.paymentStatus === "successful";
  const delivered = approved && returnOrder?.deliveryStatus === "delivered";
  const unconfirmed = ["verification_failed", "failed", "cancelled"].includes(returnOrder?.paymentStatus);
  const missingOrder = Boolean(returnRef && !returnOrder && !loading && !orderReadFailed);
  const statusUnavailable = !approved && !unconfirmed && orderReadFailed;
  const needsAttention = unconfirmed || missingOrder || statusUnavailable;
  const returnStatus = delivered ? "Renewal complete" : approved ? "Payment approved" : unconfirmed ? "Payment couldn’t be confirmed" : missingOrder ? "Order not found" : statusUnavailable ? "Payment status unavailable" : "Confirming your payment";
  const ReturnIcon = approved ? CircleCheck : needsAttention ? CircleAlert : Clock3;
  const ongoing = all.filter((o) => o.deliveryStatus !== "delivered" && !["failed", "cancelled", "verification_failed"].includes(o.paymentStatus))
    .sort((a, b) => Number(b.deliveryStatus === "out_for_delivery") - Number(a.deliveryStatus === "out_for_delivery"));
  const completed = all.filter((o) => o.deliveryStatus === "delivered");
  useEffect(() => {
    if (!user || !returnRef || !returnOrder || (!approved && !unconfirmed)) return;
    const key = "autodrive-web-payment-event-" + returnRef;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "recorded");
    } catch {
      return;
    }
    const documents = Array.isArray(returnOrder.selectedDocuments) ? returnOrder.selectedDocuments : [];
    void track(approved ? "renewal_payment_success" : "renewal_payment_failed", {
      txRef: returnRef, amountNGN: Number(returnOrder.amount),
      documentTypes: documents.map((document) => document?.documentId).filter(Boolean),
      ...(approved ? {} : { errorReason: returnOrder.paymentStatus }),
    });
  }, [approved, unconfirmed, returnOrder, returnRef, user]);
  async function action(orderId: string, action: string) { setBusy(true); setError(""); try { await customerApi("delivery/actions", { orderId, action }); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  async function openDocument(orderId: string, objectKey: string) {
    const tab = window.open("about:blank", "_blank"); if (tab) tab.opener = null;
    try { const result = await customerApi<{ url: string }>("documents/access", { orderId, objectKey }); if (tab) tab.location.replace(result.url); else window.location.assign(result.url); }
    catch (e) { tab?.close(); setError(errorMessage(e)); }
  }
  return <div className={`customer-main ${tab === "renew" && selected.length ? "has-mobile-checkout" : ""}`}><div className="customer-heading"><div><span className="customer-eyebrow">Renew and track</span><h1>{tab === "renew" ? "Your papers, taken care of." : "Your renewals"}</h1>{tab === "renew" && <p>Choose what you need. Review the price. We’ll take it from there.</p>}</div><Link className="customer-secondary" href="/renew">Your vehicles</Link></div>
    <div className="customer-tabs">{[["renew", "Renew papers"], ["ongoing", `Ongoing (${ongoing.length})`], ["completed", `Delivered (${completed.length})`]].map(([id, title]) => <button key={id} className={tab === id ? "selected" : ""} onClick={() => setTab(id)}>{title}</button>)}</div>
    {returnRef && tab !== "renew" && <section className={`customer-card customer-payment-return ${approved ? "is-approved" : needsAttention ? "is-unconfirmed" : ""}`} aria-label="Payment and renewal status">
      <div className="customer-payment-result" role="status"><span className="customer-payment-icon"><ReturnIcon size={22} aria-hidden="true" /></span><div>
        <h2>{returnStatus}</h2>
        <p>{delivered ? "Your renewed documents have been delivered." : approved ? "We received your payment. Track your renewal and delivery here." : unconfirmed ? "If you were charged, contact AutoDrive with the reference below before paying again." : missingOrder ? "Check that you signed in with the account you used to pay. If you were charged, contact AutoDrive before paying again." : statusUnavailable ? "Refresh this page to check your payment status again." : "You can leave this page and check Ongoing later. Your renewal will update once payment is verified."}</p>
        <p className="customer-small">{returnOrder && <>Reference: {returnOrder.id}</>}{approved ? ` · ${money(Number(returnOrder?.amount) || 0)}` : ""}</p>
      </div></div>
      {!needsAttention && <ol className="customer-payment-steps" aria-label="Renewal milestones">
        <li className={approved ? "is-done" : ""}>{approved && <CircleCheck size={15} aria-hidden="true" />}Payment approved</li>
        <li className={delivered ? "is-done" : ""}>{delivered && <CircleCheck size={15} aria-hidden="true" />}Renewal complete</li>
      </ol>}
      {approved && <button type="button" className="customer-secondary" onClick={() => { setTab(delivered ? "completed" : "ongoing"); window.requestAnimationFrame(() => document.getElementById(`renewal-${returnRef}`)?.scrollIntoView({ block: "start" })); }}>{delivered ? "View delivered documents" : "Track renewal"}</button>}
    </section>}{error && <div role="alert" className="customer-error">{error}</div>}
    {tab === "renew" ? <><RenewalSteps step={1} /><div className="customer-renew-grid"><div className="customer-card"><h2>Which papers are we renewing?</h2><p>Choose one or more documents, across any of your vehicles.</p>
      {vehicleLoading ? <p role="status">Loading your vehicles…</p> : !vehicles.length ? <div className="customer-empty"><FileCheck2 size={40} /><h3>Add your vehicle first</h3><p>Your documents will appear here once your vehicle is saved.</p><Link className="customer-primary" href="/renew/add-vehicle">Add vehicle</Link></div>
      : vehicles.map((car) => <section className="customer-section" key={car.carId}><div className="flex items-center gap-3"><VehicleIcon make={car.make} /><div><h3>{car.name}</h3><p className="customer-small">{car.registration?.plateNumber || "Plate not added"} · {car.registration?.state || "Registration state not added"}</p></div></div>
        {!car.documents.length && <p className="customer-small">No documents are saved for this vehicle yet.</p>}
        {car.documents.map((d) => { const key = `${car.carId}/${d.id}`; return <label className={`customer-checkbox customer-document-choice ${selected.includes(key) ? "is-selected" : ""}`} key={key}><input disabled={busy} type="checkbox" checked={selected.includes(key)} onChange={(e) => { selectDocument(key, e.target.checked); if (e.target.checked) void track("renewal_flow_started", { carId: car.carId, documentType: d.id, agentId: profile?.agentId }); }} /><span><strong>{d.type}</strong><small className={expiryStatus(d.expiration) === "soon" ? "customer-expiring-date" : undefined}>{d.expiration === "Not Set" ? "Expiry date not added" : `Expires ${new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d.expiration))}`}</small></span></label>; })}</section>)}
    </div><CustomerCheckout selection={selectedDocs} initialQuote={initialQuote} vehicles={vehicles} onRegistrationSaved={() => {}} onBusyChange={setBusy} /></div></>
    : loading ? (!returnRef && <div className="customer-card" role="status">Loading your renewals…</div>)
    : (tab === "ongoing" ? ongoing : completed).length === 0 ? (!returnRef && <div className="customer-card customer-empty"><FileCheck2 size={40} /><h2>{tab === "ongoing" ? "No ongoing renewals" : "No deliveries yet"}</h2><p>{orderReadFailed ? "Some renewals could not be loaded. Refresh to try again." : "Your orders and delivery progress will appear here."}</p><button className="customer-primary" onClick={() => setTab("renew")}>Renew papers</button></div>)
    : <div className="customer-ongoing-grid">{(tab === "ongoing" ? ongoing : completed).map((order) => {
      const pending = order.collection === "PendingOrders";
      const renewed = order.renewedDocuments && typeof order.renewedDocuments === "object" ? Object.values(order.renewedDocuments) as Array<Record<string, unknown>> : [];
      const bolt = String(order.boltTrackingUrl || ""); const safeBolt = /^https:\/\/(?:[a-z0-9-]+\.)*(?:bolt\.eu|indrive\.com)(?::443)?(?:[/?#][^\s]*)?$/i.test(bolt);
      const documents = Array.isArray(order.selectedDocuments)
        ? order.selectedDocuments.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>
        : [];
      const vehicles = Array.from(new Set(documents.map((item) => String(item.car || item.carName || "").trim()).filter(Boolean)));
      const title = vehicles.length > 1 ? `${vehicles.length} vehicles` : vehicles[0] || order.carName || order.plateNumber || "Vehicle renewal";
      const isDelivered = order.deliveryStatus === "delivered";
      const isShipping = order.deliveryStatus === "out_for_delivery";
      const steps = ["Received", "Processed", "Printed", isDelivered ? "Delivered" : "Shipping off"];
      const currentStep = isDelivered ? 5 : isShipping ? 4 : Math.max(1, Math.min(4, Math.trunc(Number(order.progressStage) || 1)));
      const showTracking = safeBolt && !isDelivered;
      const hasActions = showTracking || isShipping || renewed.some((item) => item?.objectKey);
      return <article className="customer-ongoing-card" key={order.id} id={`renewal-${order.id}`}>
        <header className="customer-ongoing-header">
          <div>
            <span className="customer-ongoing-kicker">{isDelivered ? "Delivered" : !pending && currentStep === 4 ? "Shipping off" : "Renewal order"}</span>
            <h3>{title}</h3>
            {order.plateNumber && vehicles.length <= 1 && title !== order.plateNumber && <p>{order.plateNumber}</p>}
          </div>
          <strong>{money(Number(order.amount) || 0)}</strong>
        </header>
        <div className="customer-ongoing-body">
          {isDelivered && <p className="customer-order-delivered"><CircleCheck size={18} aria-hidden="true" /> Your documents have been delivered</p>}
          {pending
            ? <p className="customer-ongoing-pending"><Clock3 size={16} aria-hidden="true" /> Awaiting payment confirmation</p>
            : <ol className="customer-ongoing-steps" aria-label="Renewal progress">
              {steps.map((label, index) => <li key={label} className={index + 1 < currentStep ? "is-done" : index + 1 === currentStep ? "is-current" : ""}
                aria-current={index + 1 === currentStep ? "step" : undefined}>
                <span className="customer-ongoing-step-dot" aria-hidden="true">{index + 1 < currentStep ? <Check size={13} /> : index + 1}</span>
                <span>{label}</span>
              </li>)}
            </ol>}
          {documents.length > 0 && <ul className="customer-ongoing-docs" aria-label={isDelivered ? "Renewed documents" : "Documents being renewed"}>
            {documents.map((item, index) => {
              const name = String(item.label || item.documentType || item.type || item.documentId || "Document").replace(/[_-]+/g, " ");
              return <li key={index}><FileCheck2 size={16} aria-hidden="true" /><span>{name}</span>
                {vehicles.length > 1 && <small>{String(item.car || item.carName || "")}</small>}
              </li>;
            })}
          </ul>}
          <dl className="customer-ongoing-details">
            <div><dt>Assigned agent</dt><dd>{String(order.agentName || "").trim() || "Agent Sarah"}</dd></div>
            <div><dt>Delivery address</dt><dd>{order.customerAddress || "Awaiting confirmation"}</dd></div>
          </dl>
          {hasActions && <div className="customer-actions customer-ongoing-actions">
            {renewed.map((item, index) => item?.objectKey ? <button key={index} type="button" className="customer-secondary" onClick={() => void openDocument(order.id, String(item.objectKey))}>View {String(item.label || item.documentId || "soft copy")}</button> : null)}
            {showTracking && <a href={bolt} target="_blank" rel="noopener noreferrer" className="customer-secondary">Track delivery</a>}
            {isShipping && <button type="button" disabled={busy} className="customer-primary" onClick={() => { if (window.confirm("Have you received your documents?")) void action(order.id, "confirm_received"); }}>I’ve received my documents</button>}
          </div>}
          <details className="customer-ongoing-reference"><summary>Order reference</summary><p>{order.txRef || order.id}</p></details>
        </div>
      </article>;
    })}</div>}
  </div>;
}
