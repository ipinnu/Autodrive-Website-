"use client";

import { motion } from "framer-motion";
import {
  FileCheck,
  Bell,
  Package,
  AlertCircle,
  Smartphone,
  LayoutDashboard,
} from "lucide-react";
import Image from "next/image";

// PhoneFrame wraps a screenshot in a rounded phone-like container.
// `cropPosition` uses CSS object-position to show a specific part of the image.
function PhoneFrame({
  src,
  alt,
  cropPosition = "top",
  height = "h-[480px]",
}: {
  src: string;
  alt: string;
  cropPosition?: string;
  height?: string;
}) {
  return (
    <div className={`relative ${height} w-full max-w-[280px] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-black/5`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        style={{ objectPosition: cropPosition }}
        sizes="280px"
      />
    </div>
  );
}

const features = [
  {
    icon: FileCheck,
    title: "Seamless Document Renewal",
    tagline: "Renew your car papers with one tap. No stress, no queues, just results.",
    details: [
      "Vehicle Licence, Motor Insurance, TIN, Proof of Ownership and more",
      "We work directly with a trusted network of licensed agents",
      "Payments are processed securely through Flutterwave",
    ],
    // Cart showing document selection per car (Vehicle License + Road Worthiness)
    image: "/images/frame-570.png",
    imageAlt: "AutoDrive renewal cart to select documents per car",
    cropPosition: "top",
    flip: false,
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    tagline:
      "We remind you 90, 60, and 30 days before anything expires. With AutoRenew, we handle it automatically so you don't have to think about it.",
    details: [
      "Timely alerts via push notification, SMS, and email",
      "Access your full renewal history and digital receipts at any time",
      "90, 60, and 30-day advance alerts for every document",
    ],
    // Car profile showing document expiry dates (some expired, some expiring soon)
    image: "/images/frame-571.png",
    imageAlt: "AutoDrive car profile showing document expiry status",
    // Crop to the documents grid at the bottom portion of the screen
    cropPosition: "60% bottom",
    flip: true,
  },
  {
    icon: Package,
    title: "Live Order Tracking",
    tagline:
      "Once you place an order, watch it move from request to your doorstep, step by step.",
    details: [
      "Monitor your document status as it moves from processing to dispatch",
      "Order reference numbers for every renewal transaction",
      "See your estimated delivery window inside the app",
    ],
    // Full delivery timeline screen with the clearest view of the tracking flow
    image: "/images/frame-568.png",
    imageAlt: "AutoDrive order tracking timeline from order to delivery",
    cropPosition: "top",
    flip: false,
  },
  {
    icon: AlertCircle,
    title: "Manage & Pay Fees",
    tagline:
      "Outstanding LASTMA or VIO fine? Don't let it grow. Pay it directly in the app with no more confusion about where to go or how much to pay.",
    details: [
      "Track fines linked to your vehicle (coming soon)",
      "Pay securely without visiting any office",
      "Stay compliant and stress free",
    ],
    // Ongoing order screen showing the real renewal flow
    image: "/images/frame-567.png",
    imageAlt: "AutoDrive renewal orders screen",
    cropPosition: "top",
    flip: true,
  },
  {
    icon: Smartphone,
    title: "Instant Softcopy + Doorstep Hardcopy",
    tagline:
      "The moment your renewal is processed, we send the softcopy to your phone. Need the physical paper? We deliver it to your home or office with no queues and no errands.",
    details: [
      "Get a digital copy sent instantly to your phone for immediate use",
      "Receive your original hardcopy within 24 to 48 hours in Lagos",
      "Expanding soon to bring doorstep delivery to more cities across Nigeria",
    ],
    // Completed orders screen showing "View Document" for delivered orders
    image: "/images/frame-569.png",
    imageAlt: "AutoDrive completed renewal order with view document",
    cropPosition: "top",
    flip: false,
  },
  {
    icon: LayoutDashboard,
    title: "Your Digital Garage",
    tagline:
      "Add all your cars in one place. Give them names. See every detail at a glance, from documents to history. Made for families with multiple cars and fleet managers alike.",
    details: [
      "Manage an unlimited number of vehicles under a single account",
      "View individual car profiles with nicknames, photos, and documents",
      "Built specifically for the needs of Nigerian multi car households",
    ],
    // Home screen showing garage image + driver's licence + My Cars list
    image: "/images/frame-577.png",
    imageAlt: "AutoDrive home screen showing your digital garage with all your cars",
    cropPosition: "top",
    flip: true,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="section-padding bg-off-white">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-gold font-semibold tracking-widest uppercase text-sm mb-4">AutoDrive Features</p>
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-navy mb-4">
            Drive Better,{" "}
            <span className="text-gold">Stay Organized</span>
          </h2>
        </motion.div>

        <div className="space-y-24">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              {/* Text */}
              <div className={feature.flip ? "lg:order-2" : "lg:order-1"}>
                <div className="inline-flex items-center gap-3 bg-gold/10 text-gold px-4 py-2 rounded-full mb-5">
                  <feature.icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">Feature 0{i + 1}</span>
                </div>
                <h3 className="font-lora text-3xl md:text-4xl font-bold text-navy mb-4">
                  {feature.title}
                </h3>
                <p className="text-xl text-navy/70 leading-relaxed mb-6 italic">
                  &ldquo;{feature.tagline}&rdquo;
                </p>
                <ul className="space-y-3">
                  {feature.details.map((detail, j) => (
                    <li key={j} className="flex items-start gap-3 text-navy/70">
                      <span className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Real screenshot */}
              <div className={`${feature.flip ? "lg:order-1" : "lg:order-2"} flex justify-center`}>
                <PhoneFrame
                  src={feature.image}
                  alt={feature.imageAlt}
                  cropPosition={feature.cropPosition}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
