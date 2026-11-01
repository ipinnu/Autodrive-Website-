import type { Metadata } from "next";
import CustomerProvider from "@/components/CustomerProvider";
import "./customer.css";

export const metadata: Metadata = { title: "Renew your papers | AutoDrive", robots: { index: false, follow: false } };
export default function RenewalLayout({ children }: { children: React.ReactNode }) {
  return <CustomerProvider>{children}</CustomerProvider>;
}
