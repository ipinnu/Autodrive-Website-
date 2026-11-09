"use client";
import { useState } from "react";
import Image from "next/image";
import { BRANDS } from "@/lib/customer";

const logos: Record<string, string> = Object.fromEntries([
  ...BRANDS, ["Acura", "acura.png"], ["Chevrolet", "chevrolet.png"], ["Dodge", "dodge.png"],
  ["GMC", "gmc.png"], ["Infiniti", "infiniti.png"], ["Jeep", "jeep.png"], ["Subaru", "subaru.png"],
].map(([brand, logo]) => [brand.toLowerCase(), logo]));

export default function VehicleIcon({ make }: { make: string }) {
  const [failedMake, setFailedMake] = useState<string | null>(null);
  const logo = logos[(make || "").trim().toLowerCase()];
  return <Image src={`/images/customer/brands/${failedMake !== make && logo ? logo : "default.png"}`}
    alt={make ? `${make} logo` : "Vehicle"} width={48} height={48} sizes="48px"
    className="h-12 w-12 shrink-0 object-contain" onError={() => setFailedMake(make)} />;
}
