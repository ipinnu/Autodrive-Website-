"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Truck, Bell, Building2, Download, ArrowRight, ArrowDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.ipinnu.AutodriveNew";

const trustItems = [
  { icon: CheckCircle, text: "No queues. No stress." },
  { icon: Truck, text: "Live Order Tracking" },
  { icon: Bell, text: "Smart renewal reminders" },
  { icon: Building2, text: "Doorstep delivery in Lagos" },
];

const screens = [
  { src: "/images/frame-577.png", alt: "AutoDrive home showing your vehicles", cropPosition: "top" },
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
      <div className="absolute inset-0 rounded-full bg-[#9fb3f3]/40 blur-3xl pointer-events-none" />

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
            aria-label={screens[i].alt}
            aria-pressed={i === current}
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
    <section id="home" className="relative isolate overflow-hidden bg-[#f8f9fd] section-padding py-16 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_35%,#dce4ff,transparent_55%),radial-gradient(ellipse_at_10%_90%,#e8f1ff,transparent_42%)]" />
      <div className="container-wide w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="font-lora text-4xl sm:text-5xl xl:text-6xl font-bold text-navy tracking-tight leading-[1.1] mb-6">
              Renew your car papers from your phone.
            </h1>

            <p className="text-lg md:text-xl text-navy/70 leading-relaxed mb-8 max-w-xl">
              Check expiry dates and get your renewed papers delivered in Lagos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/renew"
                className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-[#204583] text-white font-semibold px-7 py-4 rounded-xl transition-colors shadow-lg shadow-navy/20"
              >
                Renew now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={ANDROID_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-navy/15 bg-white/80 text-navy hover:bg-white hover:border-navy/35 font-semibold px-7 py-4 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Get the Android app
              </a>
            </div>

            <div className="mb-8 flex flex-col items-start gap-x-4 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="text-sm leading-relaxed text-navy/75 sm:text-base">
                Car papers still valid? When last did you check?
              </p>
              <a
                href="#plate-check"
                onClick={(event) => {
                  const section = document.getElementById("plate-check");
                  if (!section) return;
                  event.preventDefault();
                  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  section.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth" });
                  document.getElementById("home-plate-number")?.focus({ preventScroll: true });
                }}
                className="inline-flex shrink-0 min-h-11 items-center gap-2 font-semibold text-navy underline decoration-[#a1824a] underline-offset-4 hover:text-[#204583] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
              >
                Check my plate
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
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
            className="relative flex justify-center overflow-hidden rounded-[2rem] border border-white/90 bg-white/35 px-5 py-8 shadow-[0_24px_80px_-40px_rgba(32,54,108,0.45)] sm:py-10"
          >
            <RotatingPhone />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
