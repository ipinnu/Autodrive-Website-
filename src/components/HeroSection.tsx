"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Truck, Bell, Building2, Download, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const BETA_URL = "https://forms.gle/G3Z2agiFyVE1cEWj8";

const trustItems = [
  { icon: CheckCircle, text: "No queues. No stress." },
  { icon: Truck, text: "Live Order Tracking" },
  { icon: Bell, text: "Smart renewal reminders" },
  { icon: Building2, text: "Doorstep delivery in Lagos" },
];

const screens = [
  { src: "/images/frame-577.png", alt: "AutoDrive home showing your garage and cars", cropPosition: "top" },
  { src: "/images/frame-571.png", alt: "Car profile with document tracking", cropPosition: "top" },
  { src: "/images/frame-567.png", alt: "Renewal orders with live tracking", cropPosition: "top" },
  { src: "/images/frame-568.png", alt: "Full delivery timeline", cropPosition: "top" },
  { src: "/images/frame-570.png", alt: "Renewal cart to select documents", cropPosition: "top" },
];

function RotatingPhone() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % screens.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow behind phone */}
      <div className="absolute inset-0 bg-gold/15 rounded-full blur-3xl scale-75 opacity-70 pointer-events-none" />

      {/* Black iPhone shell */}
      <div className="relative bg-[#1a1a1a] rounded-[3rem] p-[4px] shadow-2xl shadow-black/50 w-[260px]">
        {/* Side buttons */}
        <div className="absolute -left-[6px] top-[100px] w-[6px] h-9 bg-[#2a2a2a] rounded-l-xl" />
        <div className="absolute -left-[6px] top-[150px] w-[6px] h-12 bg-[#2a2a2a] rounded-l-xl" />
        <div className="absolute -left-[6px] top-[200px] w-[6px] h-12 bg-[#2a2a2a] rounded-l-xl" />
        <div className="absolute -right-[6px] top-[140px] w-[6px] h-16 bg-[#2a2a2a] rounded-r-xl" />

        {/* Screen */}
        <div className="relative bg-black rounded-[2.7rem] overflow-hidden h-[540px]">
          {/* Rotating screenshots */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.42, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={screens[current].src}
                alt={screens[current].alt}
                fill
                className="object-cover"
                style={{ objectPosition: screens[current].cropPosition }}
                sizes="260px"
                priority
              />
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* Subtle dots */}
      <div className="flex gap-1.5 mt-4">
        {screens.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? "w-1.5 bg-gold" : "w-1.5 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section id="home" className="bg-off-white min-h-[90vh] flex items-center section-padding pt-12 pb-20">
      <div className="container-wide w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gold/10 text-gold text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-gold/20"
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              Beta Live on Android
            </motion.div>

            <h1 className="font-lora text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-navy leading-tight mb-6">
              Stop Worrying About Your{" "}
              <span className="text-gold">Car Papers.</span>
              <br />
              Your Garage,{" "}
              <span className="text-gold">Fully Digital.</span>
            </h1>

            <p className="text-lg md:text-xl text-navy/70 leading-relaxed mb-8 max-w-xl">
              AutoDrive is the app built for Nigerian drivers tired of queues,
              late fines and expired documents. Keep your cars and documents in
              one place, get reminded before anything expires and renew papers
              easily with delivery right to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href={BETA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-navy text-white font-semibold text-lg px-7 py-4 rounded-full transition-colors shadow-lg shadow-gold/25"
              >
                <Download className="w-5 h-5" />
                Join the Android Beta
              </a>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 border-2 border-navy text-navy hover:bg-navy hover:text-white font-semibold text-lg px-7 py-4 rounded-full transition-colors"
              >
                See How It Works
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {trustItems.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-navy/70">
                  <Icon className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Rotating phone */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="flex justify-center lg:justify-end"
          >
            <RotatingPhone />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
