"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import {
  BarChart3,
  Car,
  CreditCard,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPinned,
  RefreshCw,
  UserRoundPlus,
} from "lucide-react";
import { getFirebaseClient, isFirebaseConfigured } from "@/lib/firebase";

type MetricStatus = "available" | "derived" | "gap";
type DataState = "idle" | "loading" | "ready" | "unconfigured" | "error";

type AnalyticsEvent = {
  event?: string;
  userId?: string;
  ts?: unknown;
  properties?: Record<string, unknown>;
};

type OrderData = {
  userId?: string;
  uid?: string;
  buyerId?: string;
  createdAt?: unknown;
  paymentSubmittedAt?: unknown;
  renewedDocuments?: Record<string, { uploadedAt?: string }>;
  deliveryStatus?: string;
};

type CustomerProfile = {
  name: string;
  email: string;
};

type CustomerDetail = {
  customerName: string;
  customerEmail: string;
  timestamp: string;
  detail: string;
};

type DashboardMetric = {
  label: string;
  apiKey: string;
  marker: string;
  status: MetricStatus;
  note: string;
  decision: string;
};

type DashboardGroup = {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryQuestion: string;
  metrics: DashboardMetric[];
};

type GroupSummary = {
  metrics: Record<string, number | string | null>;
  details: Record<string, CustomerDetail[]>;
  decision?: string;
  trend?: string;
};

type DashboardSummary = {
  generatedAt: string;
  groups: Record<string, GroupSummary>;
};

const statusStyles: Record<MetricStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  derived: "bg-amber-50 text-amber-800 border-amber-200",
  gap: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabels: Record<MetricStatus, string> = {
  available: "Available",
  derived: "Derived",
  gap: "Needs marker",
};

const groups: DashboardGroup[] = [
  {
    key: "onboarding",
    title: "Onboarding",
    description: "Signup through verified account, without treating random app opens as value.",
    icon: UserRoundPlus,
    primaryQuestion: "Are new buyers getting through account creation without friction?",
    metrics: [
      { label: "Registration screen views", apiKey: "registrationScreenViews", marker: "screen_viewed: RegistrationScreen", status: "available", note: "Fires when the registration screen loads.", decision: "If views are high but creates are low, the registration form is blocking demand." },
      { label: "Signup abandonment", apiKey: "signupAbandonmentRate", marker: "form_abandoned: buyer_registration", status: "available", note: "Fires when a touched buyer form closes before submit.", decision: "High abandonment means simplify the field that appears most often as fieldLeft." },
      { label: "Validation error rate", apiKey: "validationErrorRate", marker: "error_shown: form_validation / Create account taps", status: "available", note: "Invalid submit errors divided by create-account taps.", decision: "High errors mean the field copy or validation rules are unclear." },
      { label: "Account to verified", apiKey: "accountToVerifiedRate", marker: "Create account tap -> Email verification completed", status: "derived", note: "Create-account is a tap today, not a clean success event.", decision: "If this is low, auth method or verification flow needs cleanup." },
      { label: "Verified sign-in completion", apiKey: "verifiedSignInCompletion", marker: "Email verification completed / Google sign-in / sign-in link", status: "gap", note: "Should follow the actual auth method in use, not the old resend-verification path.", decision: "Use this to compare Google sign-in versus Firebase sign-in link once wired." },
    ],
  },
  {
    key: "automobile-registration",
    title: "Automobile Registration",
    description: "Vehicle lookup versus manual entry, with true started-but-unfinished abandonment.",
    icon: Car,
    primaryQuestion: "Can buyers add a car quickly enough to become renewal-ready?",
    metrics: [
      { label: "Add-car sheet opened", apiKey: "addCarSheetOpened", marker: "add_car_sheet_opened", status: "available", note: "Wired to the add-car button opening the bottom sheet.", decision: "This is curiosity, not abandonment by itself." },
      { label: "Lookup attempted", apiKey: "vehicleLookupAttempted", marker: "cta_tapped: Find my vehicle", status: "available", note: "Fires after a non-empty plate is submitted.", decision: "High attempt rate means users prefer lookup over manual entry." },
      { label: "Lookup success", apiKey: "vehicleLookupSuccess", marker: "vehicle_lookup_success", status: "available", note: "Fires when vehicle data returns.", decision: "Low success means the lookup API/provider is hurting registration." },
      { label: "Lookup timeout", apiKey: "vehicleLookupTimeout", marker: "vehicle_lookup_timeout", status: "available", note: "Separates slow API failure from normal not-found errors.", decision: "Timeout spikes are backend/provider reliability issues, not UX problems." },
      { label: "Add-car abandonment", apiKey: "addCarAbandonmentRate", marker: "add_car_abandoned / intent started", status: "available", note: "Only fires after lookup/manual/field intent, not just opening and closing.", decision: "High abandonment means the add-car form is too slow or unclear after intent starts." },
    ],
  },
  {
    key: "renewal-payment",
    title: "Renewal & Payment",
    description: "The core purchasing-power flow: renewal intent, checkout, success, and payment drop-off.",
    icon: CreditCard,
    primaryQuestion: "Are buyers moving from renewal intent to successful payment?",
    metrics: [
      { label: "Renewal flows started", apiKey: "renewalFlowsStarted", marker: "renewal_flow_started", status: "available", note: "Fires when the buyer starts renewal from car/document surfaces.", decision: "This is the strongest demand signal before money is involved." },
      { label: "Reached payment", apiKey: "paymentInitiated", marker: "renewal_payment_initiated", status: "available", note: "Fires when checkout/payment screen opens.", decision: "If renewal starts but payment reach is low, quote/agent selection is blocking." },
      { label: "Payments successful", apiKey: "paymentSuccess", marker: "renewal_payment_success", status: "available", note: "Fires after successful payment verification path.", decision: "This is the client-side launch conversion anchor." },
      { label: "Failed or abandoned", apiKey: "paymentFailedOrAbandoned", marker: "renewal_payment_failed / renewal_payment_abandoned", status: "available", note: "Separates hard failures from cancelled or abandoned checkout.", decision: "High abandonment points to trust, pricing, or payment UX issues." },
      { label: "Renewal conversion", apiKey: "renewalConversionRate", marker: "renewal_flow_started -> renewal_payment_success", status: "derived", note: "Derived from started renewal flows and successful payments.", decision: "Use this for weekly go/no-go launch confidence." },
    ],
  },
  {
    key: "digital-order",
    title: "Digital Order",
    description: "What happens after payment: soft-copy access and dead ends before delivery.",
    icon: FileText,
    primaryQuestion: "Are paid buyers receiving and opening their digital documents fast enough?",
    metrics: [
      { label: "Documents opened", apiKey: "digitalDocumentsOpened", marker: "Open order document", status: "available", note: "Fires when a private R2 document URL is requested.", decision: "Shows whether customers are actually receiving value after payment." },
      { label: "Documents previewed", apiKey: "digitalDocumentsPreviewed", marker: "Preview order document", status: "available", note: "Fires when the downloaded document preview opens.", decision: "If opens are high but previews low, document access or rendering may be failing." },
      { label: "Not-sent dead end", apiKey: "documentNotSentDeadEnd", marker: "screen_viewed: document_not_sent_sheet", status: "available", note: "Fires when a buyer tries to open a missing soft copy.", decision: "High count means fulfilment communication or upload speed is weak." },
      { label: "Support follow-up", apiKey: "missingDocSupportFollowUp", marker: "Call support / Email support / Report an issue", status: "available", note: "Shows whether the missing-doc dead end leads to recovery action.", decision: "High support follow-up means the issue is painful enough to make users contact you." },
      { label: "Paid to digital received", apiKey: "paidToDigitalReceivedTime", marker: "order paid/created timestamp -> renewedDocuments[].uploadedAt", status: "derived", note: "Derived from the order timestamp and uploadedAt saved when the renewed document link is uploaded.", decision: "This is the fulfilment speed SLA customers feel most." },
    ],
  },
  {
    key: "delivery",
    title: "Order Tracking & Delivery",
    description: "Buyer delivery behaviour, not just raw operational status counts.",
    icon: MapPinned,
    primaryQuestion: "Do buyers trust the physical-document delivery flow?",
    metrics: [
      { label: "Tracking views", apiKey: "deliveryTrackingViews", marker: "screen_viewed: delivery_tracking", status: "available", note: "Fires when the buyer opens delivery tracking.", decision: "Repeat views can mean anxiety or genuine delivery engagement." },
      { label: "Open live map taps", apiKey: "openLiveMapTaps", marker: "cta_tapped: Open live map", status: "available", note: "Shows whether users need active rider tracking.", decision: "High rate means live tracking is valuable, not decorative." },
      { label: "Call dispatch taps", apiKey: "callDispatchTaps", marker: "cta_tapped: Call dispatch phone", status: "available", note: "Shows delivery uncertainty or urgency.", decision: "High call rate means delivery ETA/contact copy may be insufficient." },
      { label: "Delivery problems", apiKey: "deliveryProblemReports", marker: "cta_tapped: Report a Delivery Problem", status: "available", note: "Fires through DeliveryService.reportIssue.", decision: "Track by reason to separate rider failure from wrong details." },
      { label: "Awaiting delivery", apiKey: "awaitingPhysicalDelivery", marker: "CompletedOrders pipeline query", status: "derived", note: "Operational count from deliveryStatus, not an analytics event.", decision: "Use as workload pressure, not behaviour insight." },
    ],
  },
];

function eventCount(events: AnalyticsEvent[], event: string, props: Record<string, unknown> = {}) {
  return events.filter((entry) => {
    if (entry.event !== event) return false;
    return Object.entries(props).every(([key, value]) => entry.properties?.[key] === value);
  }).length;
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function toMillis(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function formatTimestamp(value: unknown) {
  const millis = toMillis(value);
  return millis ? new Date(millis).toLocaleString() : "No timestamp";
}

function customerFor(userId: string | undefined, customers: Record<string, CustomerProfile>) {
  if (!userId) return { customerName: "Unknown customer", customerEmail: "No email saved" };
  const customer = customers[userId];
  return {
    customerName: customer?.name || userId,
    customerEmail: customer?.email || "No email saved",
  };
}

function eventRows(
  events: AnalyticsEvent[],
  customers: Record<string, CustomerProfile>,
  event: string,
  props: Record<string, unknown> = {},
  detail = event,
) {
  return events
    .filter((entry) => {
      if (entry.event !== event) return false;
      return Object.entries(props).every(([key, value]) => entry.properties?.[key] === value);
    })
    .slice(0, 6)
    .map((entry) => ({
      ...customerFor(entry.userId, customers),
      timestamp: formatTimestamp(entry.ts),
      detail,
    }));
}

function combinedEventRows(
  events: AnalyticsEvent[],
  customers: Record<string, CustomerProfile>,
  matchers: Array<{ event: string; props?: Record<string, unknown>; detail: string }>,
) {
  return events
    .filter((entry) =>
      matchers.some((matcher) => {
        if (entry.event !== matcher.event) return false;
        return Object.entries(matcher.props ?? {}).every(([key, value]) => entry.properties?.[key] === value);
      }),
    )
    .slice(0, 6)
    .map((entry) => {
      const matcher = matchers.find((item) => {
        if (entry.event !== item.event) return false;
        return Object.entries(item.props ?? {}).every(([key, value]) => entry.properties?.[key] === value);
      });
      return {
        ...customerFor(entry.userId, customers),
        timestamp: formatTimestamp(entry.ts),
        detail: matcher?.detail ?? entry.event ?? "Event",
      };
    });
}

function orderUserId(order: OrderData) {
  return order.userId || order.uid || order.buyerId;
}

function orderRows(
  orders: OrderData[],
  customers: Record<string, CustomerProfile>,
  predicate: (order: OrderData) => boolean,
  timestampFor: (order: OrderData) => unknown,
  detail: string,
) {
  return orders
    .filter(predicate)
    .slice(0, 6)
    .map((order) => ({
      ...customerFor(orderUserId(order), customers),
      timestamp: formatTimestamp(timestampFor(order)),
      detail,
    }));
}

function averagePaidToDigitalMinutes(orders: OrderData[]) {
  const durations = orders.flatMap((order) => {
    const start = toMillis(order.paymentSubmittedAt) ?? toMillis(order.createdAt);
    if (!start || !order.renewedDocuments) return [];
    return Object.values(order.renewedDocuments).flatMap((document) => {
      const uploaded = toMillis(document.uploadedAt);
      return uploaded && uploaded >= start ? [(uploaded - start) / 60000] : [];
    });
  });
  if (!durations.length) return null;
  const average = durations.reduce((total, value) => total + value, 0) / durations.length;
  return `${Math.round(average)} min`;
}

function buildSummary(
  events: AnalyticsEvent[],
  completedOrders: OrderData[],
  customers: Record<string, CustomerProfile>,
): DashboardSummary {
  const createAccountTaps = eventCount(events, "cta_tapped", { ctaLabel: "Create account" });
  const formValidationErrors = eventCount(events, "error_shown", { errorCode: "form_validation" });
  const registrationViews = eventCount(events, "screen_viewed", { screenName: "RegistrationScreen" });
  const verified = eventCount(events, "cta_tapped", { ctaLabel: "Email verification completed" });
  const renewalStarts = eventCount(events, "renewal_flow_started");
  const paymentSuccess = eventCount(events, "renewal_payment_success");
  const paymentFailed = eventCount(events, "renewal_payment_failed");
  const paymentAbandoned = eventCount(events, "renewal_payment_abandoned");
  const addCarOpened = eventCount(events, "add_car_sheet_opened");
  const addCarAbandoned = eventCount(events, "add_car_abandoned");
  const deliveryIssues = eventCount(events, "cta_tapped", { ctaLabel: "Report a Delivery Problem" });

  return {
    generatedAt: new Date().toLocaleString(),
    groups: {
      onboarding: {
        trend: "Signup",
        metrics: {
          registrationScreenViews: registrationViews,
          signupAbandonmentRate: percent(eventCount(events, "form_abandoned", { formName: "buyer_registration" }), registrationViews),
          validationErrorRate: percent(formValidationErrors, createAccountTaps),
          accountToVerifiedRate: percent(verified, createAccountTaps),
          verifiedSignInCompletion: null,
        },
        details: {
          registrationScreenViews: eventRows(events, customers, "screen_viewed", { screenName: "RegistrationScreen" }, "Registration screen viewed"),
          signupAbandonmentRate: eventRows(events, customers, "form_abandoned", { formName: "buyer_registration" }, "Signup form abandoned"),
          validationErrorRate: eventRows(events, customers, "error_shown", { errorCode: "form_validation" }, "Validation error shown"),
          accountToVerifiedRate: eventRows(events, customers, "cta_tapped", { ctaLabel: "Email verification completed" }, "Email verification completed"),
          verifiedSignInCompletion: [],
        },
      },
      "automobile-registration": {
        trend: "Garage",
        metrics: {
          addCarSheetOpened: addCarOpened,
          vehicleLookupAttempted: eventCount(events, "cta_tapped", { ctaLabel: "Find my vehicle" }),
          vehicleLookupSuccess: eventCount(events, "vehicle_lookup_success"),
          vehicleLookupTimeout: eventCount(events, "vehicle_lookup_timeout"),
          addCarAbandonmentRate: percent(addCarAbandoned, addCarOpened),
        },
        details: {
          addCarSheetOpened: eventRows(events, customers, "add_car_sheet_opened", {}, "Add-car sheet opened"),
          vehicleLookupAttempted: eventRows(events, customers, "cta_tapped", { ctaLabel: "Find my vehicle" }, "Vehicle lookup attempted"),
          vehicleLookupSuccess: eventRows(events, customers, "vehicle_lookup_success", {}, "Vehicle lookup succeeded"),
          vehicleLookupTimeout: eventRows(events, customers, "vehicle_lookup_timeout", {}, "Vehicle lookup timed out"),
          addCarAbandonmentRate: eventRows(events, customers, "add_car_abandoned", {}, "Add-car flow abandoned after intent"),
        },
      },
      "renewal-payment": {
        trend: "Revenue",
        metrics: {
          renewalFlowsStarted: renewalStarts,
          paymentInitiated: eventCount(events, "renewal_payment_initiated"),
          paymentSuccess,
          paymentFailedOrAbandoned: paymentFailed + paymentAbandoned,
          renewalConversionRate: percent(paymentSuccess, renewalStarts),
        },
        details: {
          renewalFlowsStarted: eventRows(events, customers, "renewal_flow_started", {}, "Renewal flow started"),
          paymentInitiated: eventRows(events, customers, "renewal_payment_initiated", {}, "Payment screen reached"),
          paymentSuccess: eventRows(events, customers, "renewal_payment_success", {}, "Payment successful"),
          paymentFailedOrAbandoned: combinedEventRows(events, customers, [
            { event: "renewal_payment_failed", detail: "Payment failed" },
            { event: "renewal_payment_abandoned", detail: "Payment abandoned" },
          ]),
          renewalConversionRate: eventRows(events, customers, "renewal_payment_success", {}, "Converted from renewal to payment"),
        },
      },
      "digital-order": {
        trend: "Fulfilment",
        metrics: {
          digitalDocumentsOpened: eventCount(events, "cta_tapped", { ctaLabel: "Open order document" }),
          digitalDocumentsPreviewed: eventCount(events, "cta_tapped", { ctaLabel: "Preview order document" }),
          documentNotSentDeadEnd: eventCount(events, "screen_viewed", { screenName: "document_not_sent_sheet" }),
          missingDocSupportFollowUp: eventCount(events, "cta_tapped", { ctaLabel: "Call support" }) + eventCount(events, "cta_tapped", { ctaLabel: "Email support" }) + eventCount(events, "cta_tapped", { ctaLabel: "Report an issue" }),
          paidToDigitalReceivedTime: averagePaidToDigitalMinutes(completedOrders),
        },
        details: {
          digitalDocumentsOpened: eventRows(events, customers, "cta_tapped", { ctaLabel: "Open order document" }, "Document opened"),
          digitalDocumentsPreviewed: eventRows(events, customers, "cta_tapped", { ctaLabel: "Preview order document" }, "Document previewed"),
          documentNotSentDeadEnd: eventRows(events, customers, "screen_viewed", { screenName: "document_not_sent_sheet" }, "Missing document dead end"),
          missingDocSupportFollowUp: combinedEventRows(events, customers, [
            { event: "cta_tapped", props: { ctaLabel: "Call support" }, detail: "Called support" },
            { event: "cta_tapped", props: { ctaLabel: "Email support" }, detail: "Emailed support" },
            { event: "cta_tapped", props: { ctaLabel: "Report an issue" }, detail: "Reported an issue" },
          ]),
          paidToDigitalReceivedTime: orderRows(
            completedOrders,
            customers,
            (order) => Boolean(order.renewedDocuments && Object.values(order.renewedDocuments).some((document) => document.uploadedAt)),
            (order) => Object.values(order.renewedDocuments ?? {}).find((document) => document.uploadedAt)?.uploadedAt,
            "Digital document uploaded",
          ),
        },
      },
      delivery: {
        trend: "Delivery",
        metrics: {
          deliveryTrackingViews: eventCount(events, "screen_viewed", { screenName: "delivery_tracking" }),
          openLiveMapTaps: eventCount(events, "cta_tapped", { ctaLabel: "Open live map" }),
          callDispatchTaps: eventCount(events, "cta_tapped", { ctaLabel: "Call dispatch phone" }),
          deliveryProblemReports: deliveryIssues,
          awaitingPhysicalDelivery: completedOrders.filter((order) => order.deliveryStatus && order.deliveryStatus !== "delivered").length,
        },
        details: {
          deliveryTrackingViews: eventRows(events, customers, "screen_viewed", { screenName: "delivery_tracking" }, "Delivery tracking viewed"),
          openLiveMapTaps: eventRows(events, customers, "cta_tapped", { ctaLabel: "Open live map" }, "Live map opened"),
          callDispatchTaps: eventRows(events, customers, "cta_tapped", { ctaLabel: "Call dispatch phone" }, "Dispatch called"),
          deliveryProblemReports: eventRows(events, customers, "cta_tapped", { ctaLabel: "Report a Delivery Problem" }, "Delivery problem reported"),
          awaitingPhysicalDelivery: orderRows(
            completedOrders,
            customers,
            (order) => Boolean(order.deliveryStatus && order.deliveryStatus !== "delivered"),
            (order) => order.paymentSubmittedAt ?? order.createdAt,
            "Awaiting physical delivery",
          ),
        },
      },
    },
  };
}

function formatValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString() : `${value.toFixed(1)}%`;
  return value;
}

function DashboardLogin({ onLogin, error }: { onLogin: (email: string, password: string) => void; error: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen bg-[#F4F6FA] px-4 py-12">
      <div className="mx-auto max-w-md rounded-lg border border-navy/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-navy text-white"><LockKeyhole className="h-5 w-5" /></div>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-gold">Admin only</p>
        <h1 className="font-lora text-3xl font-bold text-navy">Dashboard login</h1>
        <p className="mt-2 text-sm leading-6 text-navy/60">Sign in with a Firebase admin account. No sign-up is available from this page.</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); onLogin(email, password); }}>
          <label className="block"><span className="text-sm font-bold text-navy">Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-navy outline-none transition focus:border-gold" placeholder="admin@autodrive.ng" /></label>
          <label className="block"><span className="text-sm font-bold text-navy">Password</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-navy outline-none transition focus:border-gold" placeholder="Firebase password" /></label>
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
          <button type="submit" className="w-full rounded-md bg-navy px-4 py-3 text-sm font-black text-white transition hover:bg-gold">Continue to dashboard</button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="border-b border-navy/10 bg-white px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center justify-between lg:block"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-gold">AutoDrive</p><h1 className="font-lora text-2xl font-bold text-navy">Dashboard</h1></div><button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-md border border-navy/15 px-3 py-2 text-sm font-bold text-navy lg:hidden"><LogOut className="h-4 w-4" /> Log out</button></div>
      <nav className="mt-5 grid gap-2"><Link href="/dashboard" className="flex items-center gap-3 rounded-md bg-navy px-3 py-3 text-sm font-black text-white"><LayoutDashboard className="h-4 w-4" /> Overview</Link><Link href="/dashboard/decision" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-navy/70 transition hover:bg-navy/5 hover:text-navy"><BarChart3 className="h-4 w-4" /> Decision</Link></nav>
      <button type="button" onClick={onLogout} className="mt-8 hidden w-full items-center justify-center gap-2 rounded-md border border-navy/15 px-3 py-2.5 text-sm font-bold text-navy transition hover:border-gold hover:text-gold lg:inline-flex"><LogOut className="h-4 w-4" /> Log out</button>
    </aside>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState("");
  const [activeKey, setActiveKey] = useState(groups[0].key);
  const [drilldown, setDrilldown] = useState<{ group: DashboardGroup; metric: DashboardMetric } | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dataState, setDataState] = useState<DataState>("idle");

  const activeGroup = useMemo(() => groups.find((group) => group.key === activeKey) ?? groups[0], [activeKey]);
  const activeSummary = summary?.groups?.[activeGroup.key];
  const drilldownSummary = drilldown ? summary?.groups?.[drilldown.group.key] : null;
  const drilldownRows = drilldown ? drilldownSummary?.details?.[drilldown.metric.apiKey] ?? [] : [];

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setDataState("unconfigured");
      return;
    }
    const client = getFirebaseClient();
    if (!client) return;
    return onAuthStateChanged(client.auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    setDataState("loading");
    const client = getFirebaseClient();
    if (!client) {
      setDataState("unconfigured");
      return;
    }
    Promise.all([
      getDocs(query(collection(client.db, "analytics_events"), orderBy("ts", "desc"), limit(2000))),
      getDocs(query(collection(client.db, "CompletedOrders"), limit(500))),
      getDocs(collection(client.db, "users")),
    ])
      .then(([eventSnapshot, orderSnapshot, userSnapshot]) => {
        const events = eventSnapshot.docs.map((doc) => doc.data() as AnalyticsEvent);
        const orders = orderSnapshot.docs.map((doc) => doc.data() as OrderData);
        const customers = Object.fromEntries(
          userSnapshot.docs.map((doc) => {
            const data = doc.data();
            return [
              doc.id,
              {
                name: [data.username, data.name, data.fullName, data.businessName]
                  .map((value) => (typeof value === "string" ? value.trim() : ""))
                  .find(Boolean) ?? doc.id,
                email: typeof data.email === "string" && data.email.trim() ? data.email.trim() : "No email saved",
              },
            ];
          }),
        );
        setSummary(buildSummary(events, orders, customers));
        setDataState("ready");
      })
      .catch(() => setDataState("error"));
  }, [user]);

  async function handleLogin(email: string, password: string) {
    setLoginError("");
    if (!isFirebaseConfigured) {
      setLoginError("Firebase browser config is missing in Vercel env vars.");
      return;
    }
    try {
      const client = getFirebaseClient();
      if (!client) throw new Error("Firebase is not configured");
      await signInWithEmailAndPassword(client.auth, email, password);
    } catch {
      setLoginError("Could not sign in. Confirm this is an admin Firebase account.");
    }
  }

  async function handleLogout() {
    const client = getFirebaseClient();
    if (client) await signOut(client.auth);
    setUser(null);
    setSummary(null);
  }

  if (!user) return <DashboardLogin onLogin={handleLogin} error={loginError} />;

  return (
    <div className="min-h-screen bg-[#F4F6FA] lg:pl-80">
      <Sidebar onLogout={handleLogout} />
      <main className="px-4 py-6 md:px-8 lg:px-12">
        <header className="mb-6 flex flex-col gap-4 border-b border-navy/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-gold">Overview</p><h2 className="font-lora text-3xl font-bold text-navy md:text-4xl">Customer flow health</h2><p className="mt-2 max-w-3xl text-base leading-7 text-navy/65">One glance for business decisions. Tap any card to focus the exact signals and what they mean.</p></div>
          <div className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-bold text-navy/70">{dataState === "ready" && `Firebase connected · ${summary?.generatedAt}`}{dataState === "loading" && <span className="inline-flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Reading Firestore</span>}{dataState === "unconfigured" && "Set Firebase browser config env vars"}{dataState === "error" && "Firestore read unavailable; check admin rules"}</div>
        </header>

        <section className="grid gap-4 xl:grid-cols-5">
          {groups.map((group) => {
            const Icon = group.icon;
            const groupSummary = summary?.groups?.[group.key];
            const primaryValue = formatValue(groupSummary?.metrics?.[group.metrics[0].apiKey]);
            const isActive = group.key === activeGroup.key;
            return <button key={group.key} type="button" onClick={() => setActiveKey(group.key)} className={`rounded-lg border bg-white p-4 text-left shadow-sm transition ${isActive ? "border-gold ring-2 ring-gold/25" : "border-navy/10 hover:border-gold/70"}`}><div className="mb-3 flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-navy text-white"><Icon className="h-5 w-5" /></span><span className="text-2xl font-black text-navy">{primaryValue}</span></div><h3 className="font-lora text-lg font-bold text-navy">{group.title}</h3><p className="mt-1 text-sm leading-5 text-navy/58">{group.primaryQuestion}</p></button>;
          })}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-lg border border-navy/10 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Focused card</p><h3 className="mt-1 font-lora text-2xl font-bold text-navy">{activeGroup.title}</h3><p className="mt-1 text-sm leading-6 text-navy/62">{activeGroup.description}</p></div><span className="rounded-full bg-navy px-3 py-1 text-xs font-black text-white">{activeSummary?.trend ?? "Waiting for Firebase"}</span></div><div className="grid gap-3 md:grid-cols-2">{activeGroup.metrics.map((metric) => <button type="button" onClick={() => setDrilldown({ group: activeGroup, metric })} key={metric.apiKey} className="rounded-md border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-gold hover:bg-white"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-navy">{metric.label}</p><p className="mt-1 font-mono text-xs text-navy/50">{metric.marker}</p></div><p className="text-xl font-black text-navy">{formatValue(activeSummary?.metrics?.[metric.apiKey])}</p></div><span className={`mt-3 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[metric.status]}`}>{statusLabels[metric.status]}</span><p className="mt-2 text-sm leading-6 text-navy/62">{metric.note}</p></button>)}</div></article>
          <aside className="rounded-lg border border-navy/10 bg-white p-5 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.14em] text-gold">Business read</p><h3 className="mt-1 font-lora text-2xl font-bold text-navy">What to decide</h3><p className="mt-2 text-sm leading-6 text-navy/65">{activeSummary?.decision ?? activeGroup.primaryQuestion}</p><div className="mt-5 space-y-3">{activeGroup.metrics.map((metric) => <div key={metric.apiKey} className="rounded-md bg-[#F4F6FA] p-3"><p className="text-sm font-black text-navy">{metric.label}</p><p className="mt-1 text-sm leading-6 text-navy/62">{metric.decision}</p></div>)}</div></aside>
        </section>
      </main>
      {drilldown ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/45 px-4 py-6" role="dialog" aria-modal="true">
          <section className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-navy/10 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">{drilldown.group.title}</p>
                <h3 className="mt-1 font-lora text-2xl font-bold text-navy">{drilldown.metric.label}</h3>
                <p className="mt-1 font-mono text-xs text-navy/50">{drilldown.metric.marker}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-navy">{formatValue(drilldownSummary?.metrics?.[drilldown.metric.apiKey])}</p>
                <button type="button" onClick={() => setDrilldown(null)} className="mt-2 rounded-md border border-navy/15 px-3 py-1.5 text-sm font-bold text-navy transition hover:border-gold hover:text-gold">Close</button>
              </div>
            </div>
            <div className="max-h-[62vh] overflow-y-auto p-5">
              {drilldownRows.length ? (
                <ul className="divide-y divide-slate-200">
                  {drilldownRows.map((row, index) => (
                    <li key={`${row.customerEmail}-${row.timestamp}-${index}`} className="grid gap-2 py-3 md:grid-cols-[1fr_1fr_0.8fr] md:items-center">
                      <div>
                        <p className="text-sm font-black text-navy">{row.customerName}</p>
                        <p className="text-xs text-navy/55">{row.customerEmail}</p>
                      </div>
                      <p className="text-sm font-bold text-navy/70">{row.detail}</p>
                      <p className="text-sm text-navy/55 md:text-right">{row.timestamp}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-md bg-[#F4F6FA] p-4 text-sm font-bold text-navy/60">No customer records for this card yet.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}


