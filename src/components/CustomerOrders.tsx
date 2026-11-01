"use client";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where, type DocumentData } from "firebase/firestore";
import { FileCheck2, MapPin } from "lucide-react";
import Link from "next/link";
import { useCustomer } from "./CustomerProvider";
import CustomerCheckout from "./CustomerCheckout";
import { client, errorMessage, loadVehicles, track, type Vehicle } from "@/lib/customer";
import { customerApi, money, type Selection } from "@/lib/customer-checkout";

export default function CustomerOrders() {
  const { user, profile } = useCustomer(); const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState(""); const [orders, setOrders] = useState<Record<string, DocumentData[]>>({}); const [tab, setTab] = useState("renew");
  const [notice, setNotice] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) return; const uid = user.uid; let active = true;
    const params = new URLSearchParams(window.location.search); const carId = params.get("car");
    if (params.has("tx_ref")) { setTab("ongoing"); setNotice(["successful", "completed"].includes(params.get("status") || "")
      ? "Payment submitted. Your order will update here after server confirmation." : "Check your payment and order status below. A browser return does not confirm payment."); }
    void loadVehicles(uid).then((cars) => { if (!active) return; setVehicles(cars); if (carId) setSelected(cars.filter((c) => c.carId === carId).flatMap((c) => c.documents.map((d) => `${c.carId}/${d.id}`))); }).catch((e) => setError(errorMessage(e)));
    const loaded = new Set<string>();
    const stops = ["PendingOrders", "Orders", "CompletedOrders"].map((name) => onSnapshot(query(collection(client().db, name), where("uid", "==", uid)), (snapshot) => {
      if (!active) return; const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id, collection: name }));
      setOrders((current) => ({ ...current, [name]: items })); loaded.add(name); if (loaded.size === 3) setLoading(false);
    }, (e) => { if (active) { setError(errorMessage(e)); setLoading(false); } }));
    return () => { active = false; stops.forEach((stop) => stop()); };
  }, [user]);
  const all = useMemo(() => Object.values(orders).flat().sort((a, b) => {
    const time = (v: unknown) => v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : Date.parse(String(v)) || 0;
    return time(b.createdAt) - time(a.createdAt);
  }), [orders]);
  const selectedDocs: Selection[] = selected.map((value) => { const [carId, documentId] = value.split("/"); return { carId, documentId }; });
  const ongoing = all.filter((o) => o.deliveryStatus !== "delivered" && !["failed", "cancelled"].includes(o.paymentStatus));
  const completed = all.filter((o) => o.deliveryStatus === "delivered");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search); const txRef = params.get("tx_ref");
    if (!txRef || !user || !params.get("transaction_id")) return;
    const order = all.find((o) => o.id === txRef && o.uid === user.uid);
    const key = `autodrive-web-payment-event-${txRef}`;
    if (!order || sessionStorage.getItem(key)) return;
    const success = ["successful", "completed"].includes(params.get("status") || "");
    sessionStorage.setItem(key, "recorded");
    void track(success ? "renewal_payment_success" : "renewal_payment_failed", { txRef, amountNGN: Number(order.amount),
      documentTypes: (order.selectedDocuments || []).map((d: Record<string, string>) => d.documentId),
      ...(success ? {} : { errorReason: params.get("status") || "not_completed" }) });
  }, [all, user]);
  async function action(orderId: string, action: string) { setBusy(true); setError(""); try { await customerApi("delivery/actions", { orderId, action }); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  async function openDocument(orderId: string, objectKey: string) {
    const tab = window.open("about:blank", "_blank"); if (tab) tab.opener = null;
    try { const result = await customerApi<{ url: string }>("documents/access", { orderId, objectKey }); if (tab) tab.location.replace(result.url); else window.location.assign(result.url); }
    catch (e) { tab?.close(); setError(errorMessage(e)); }
  }
  return <div className="customer-main"><div className="customer-heading"><div><span className="customer-eyebrow">Renew and track</span><h1>Keep your papers moving.</h1><p>Renew selected documents and follow your assigned agent’s progress.</p></div><Link className="customer-secondary" href="/renew">Your vehicles</Link></div>
    <div className="customer-tabs">{[["renew", "Renew papers"], ["ongoing", `Ongoing (${ongoing.length})`], ["completed", `Delivered (${completed.length})`]].map(([id, title]) => <button key={id} className={tab === id ? "selected" : ""} onClick={() => setTab(id)}>{title}</button>)}</div>
    {notice && <div className="customer-notice" role="status">{notice}</div>}{error && <div role="alert" className="customer-error">{error}</div>}
    {tab === "renew" ? <><div className="customer-card"><h2>Select documents to renew</h2><p>Choose one document or combine documents across your vehicles. Delivery is added once.</p>
      {!vehicles.length ? <div className="customer-empty"><FileCheck2 size={40} /><h3>Add your vehicle first</h3><Link className="customer-primary" href="/renew/add-vehicle">Add vehicle</Link></div>
      : vehicles.map((car) => <section className="customer-section" key={car.carId}><h3>{car.name}</h3><p className="customer-small">{car.registration?.plateNumber || "Plate not added"} · {car.registration?.state || "Registration state not added"}</p>
        {car.documents.map((d) => { const key = `${car.carId}/${d.id}`; return <label className="customer-checkbox" key={key}><input disabled={busy} type="checkbox" checked={selected.includes(key)} onChange={(e) => { setSelected((s) => e.target.checked ? [...s, key] : s.filter((id) => id !== key)); if (e.target.checked) void track("renewal_flow_started", { carId: car.carId, documentType: d.id, agentId: profile?.agentId }); }} />{d.type}<span className="customer-small customer-muted ml-auto">{d.expiration === "Not Set" ? "Expiry not added" : d.expiration}</span></label>; })}</section>)}
    </div><CustomerCheckout selection={selectedDocs} onBusyChange={setBusy} /></>
    : loading ? <div className="customer-card" role="status">Loading your renewals…</div>
    : (tab === "ongoing" ? ongoing : completed).length === 0 ? <div className="customer-card customer-empty"><FileCheck2 size={40} /><h2>{tab === "ongoing" ? "No ongoing renewals" : "No deliveries yet"}</h2><p>Your orders and delivery progress will appear here.</p><button className="customer-primary" onClick={() => setTab("renew")}>Renew papers</button></div>
    : (tab === "ongoing" ? ongoing : completed).map((order) => {
      const pending = order.collection === "PendingOrders"; const stage = Math.max(0, Math.min(3, Number(order.progressStage) || 0));
      const renewed = order.renewedDocuments && typeof order.renewedDocuments === "object" ? Object.values(order.renewedDocuments) as Array<Record<string, unknown>> : [];
      const bolt = String(order.boltTrackingUrl || ""); const safeBolt = /^https:\/\/[^\s]+$/i.test(bolt);
      return <article className="customer-card" key={order.id}><div className="flex items-center justify-between gap-3"><h3>{pending ? "Awaiting payment confirmation" : ["Getting started", "Processing", "Rounding up", "Shipping off"][stage]}</h3><span className="customer-badge">{order.deliveryStatus === "delivered" ? "Delivered" : pending ? "Pending verification" : "In progress"}</span></div>
        <p className="customer-small">Order {order.txRef || order.id} · {money(Number(order.amount) || 0)}</p>
        <ul>{(order.selectedDocuments as Array<Record<string, string>> || []).map((d, i) => <li key={i} className="customer-small">{d.documentId} · {d.car}</li>)}</ul>
        {!pending && <div className="customer-progress"><span style={{ width: `${(stage + 1) * 25}%` }} /></div>}
        <p className="customer-small"><MapPin size={14} className="inline mr-1" />{order.customerAddress || "Delivery address pending confirmation"}</p>
        <p className="customer-small">Assigned agent: {order.agentName || "AutoDrive agent"}</p>
        <div className="customer-actions">{renewed.map((document, i) => document.objectKey ? <button key={i} className="customer-secondary" onClick={() => void openDocument(order.id, String(document.objectKey))}>View {String(document.label || document.documentId || "soft copy")}</button> : null)}
          {safeBolt && <a href={bolt} target="_blank" rel="noopener noreferrer" className="customer-secondary">Track delivery</a>}
          {order.deliveryStatus === "out_for_delivery" && <button disabled={busy} className="customer-primary" onClick={() => { if (window.confirm("Have you received your documents?")) void action(order.id, "confirm_received"); }}>I’ve received my documents</button>}
        </div>
      </article>;
    })}
  </div>;
}
