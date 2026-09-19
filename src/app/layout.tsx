import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AutoDrive Nigeria | Stay on the Road. We Keep You Ready.",
  description:
    "AutoDrive is Nigeria's first fully centralized car document management platform. Renew your vehicle licence, insurance, and roadworthiness with doorstep delivery in Lagos. Join the free Android beta today.",
  keywords:
    "car document renewal Nigeria, vehicle licence Lagos, AutoDrive Nigeria, motor insurance renewal, LASTMA fine payment, car papers Lagos",
  openGraph: {
    title: "AutoDrive Nigeria | Stay on the Road. We Keep You Ready.",
    description:
      "Stop worrying about expired car papers. AutoDrive handles renewals, reminders, fines, and doorstep delivery from your phone.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lora.variable} ${sourceSans.variable}`}>
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
