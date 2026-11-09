import Link from "next/link";
import { Check } from "lucide-react";

export default function RenewalSteps({ step }: { step: 1 | 2 }) {
  return <nav className="customer-renewal-steps" aria-label="Renewal progress"><ol>
    {["Price review", "Your details", "Secure payment"].map((label, i) => <li key={label} className={i + 1 === step ? "current" : i + 1 < step ? "complete" : ""} aria-current={i + 1 === step ? "step" : undefined}>
      <span className="step-number">{i + 1 < step ? <Check size={14} /> : i + 1}</span>{i === 0 && step === 2 ? <Link href="/renew/orders">{label}</Link> : <span>{label}</span>}
    </li>)}
  </ol></nav>;
}
