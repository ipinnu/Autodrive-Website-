"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Package, CheckCircle2, Clock, Truck, Home, Car, MapPin } from "lucide-react";

const screens = [
  {
    id: "dashboard",
    label: "Dashboard",
    content: (
      <div className="flex flex-col h-full bg-[#F4F6FA]">
        {/* Header */}
        <div className="bg-[#0F2A45] px-4 pt-6 pb-10 rounded-b-3xl">
          <p className="text-white/70 text-xs mb-1">Good morning,</p>
          <h3 className="text-white font-bold text-lg font-lora">Tope&apos;s Garage</h3>
          <p className="text-white/60 text-xs mt-1">2 vehicles, 1 alert</p>
        </div>

        {/* Car card */}
        <div className="mx-3 -mt-6 bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-navy text-sm">Tope&apos;s Baby</p>
              <p className="text-gray-500 text-xs">Lexus RX 350, GWA 125EY</p>
            </div>
            <span className="text-xs bg-gold/10 text-gold font-semibold px-2 py-1 rounded-full">1 Due</span>
          </div>

          <div className="mt-3 space-y-2">
            {[
              { name: "Vehicle Licence", status: "Expires in 23 days", color: "text-gold" },
              { name: "Motor Insurance", status: "Valid, 8 months left", color: "text-gold" },
              { name: "Roadworthiness", status: "Valid, 4 months left", color: "text-gold" },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{doc.name}</span>
                <span className={`text-xs font-medium ${doc.color}`}>{doc.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Second car */}
        <div className="mx-3 mt-3 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-navy" />
            </div>
            <div>
              <p className="font-bold text-navy text-sm">The Family Car</p>
              <p className="text-gray-500 text-xs">Mercedes C350, AGL 744KJ</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "alerts",
    label: "Renewal Alerts",
    content: (
      <div className="flex flex-col h-full bg-[#F4F6FA]">
        <div className="bg-[#0F2A45] px-4 pt-6 pb-10 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gold" />
            <p className="text-white font-bold text-base font-lora">Renewal Alerts</p>
          </div>
          <p className="text-white/60 text-xs mt-1">3 upcoming renewals</p>
        </div>

        <div className="mx-3 -mt-6 space-y-3">
          {[
            {
              car: "Tope&apos;s Baby",
              doc: "Vehicle Licence",
              days: 23,
              urgency: "bg-gold/10 text-gold border-gold/20",
              badge: "Due Soon",
            },
            {
              car: "The Family Car",
              doc: "Vehicle Licence",
              days: 91,
              urgency: "bg-blue-50 text-blue-600 border-blue-100",
              badge: "3 Months",
            },
            {
              car: "The Family Car",
              doc: "Motor Insurance",
              days: 120,
              urgency: "bg-green-50 text-gold border-green-100",
              badge: "Upcoming",
            },
          ].map((alert, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{alert.car.replace("&apos;", "'")}</p>
                  <p className="font-bold text-navy text-sm mt-0.5">{alert.doc}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {alert.days} days remaining
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${alert.urgency}`}>
                  {alert.badge}
                </span>
              </div>
              <button className="mt-3 w-full bg-gold text-white text-xs font-semibold py-2 rounded-xl">
                Renew Now
              </button>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "tracking",
    label: "Order Tracking",
    content: (
      <div className="flex flex-col h-full bg-[#F4F6FA]">
        <div className="bg-[#0F2A45] px-4 pt-6 pb-8 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gold" />
            <p className="text-white font-bold text-base font-lora">Order Tracking</p>
          </div>
          <p className="text-white/60 text-xs mt-1">Order #AD-2025-0041</p>
        </div>

        <div className="mx-3 -mt-4 bg-white rounded-2xl shadow-lg p-5">
          <p className="text-xs text-gray-500 mb-1">Vehicle Licence for Tope&apos;s Baby</p>
          <p className="font-bold text-navy text-sm mb-4">GWA 125EY, Lexus RX 350</p>

          {[
            { label: "Order Placed", done: true, active: false },
            { label: "Agent Confirmed", done: true, active: false },
            { label: "Papers Printed", done: true, active: true },
            { label: "Out for Delivery", done: false, active: false },
            { label: "Delivered", done: false, active: false },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done
                      ? "bg-gold"
                      : step.active
                      ? "bg-gold ring-4 ring-gold/20"
                      : "bg-gray-200"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : step.active ? (
                    <Truck className="w-3.5 h-3.5 text-white" />
                  ) : i === 4 ? (
                    <Home className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  )}
                </div>
                {i < 4 && (
                  <div className={`w-0.5 h-6 mt-1 ${step.done ? "bg-gold" : "bg-gray-200"}`} />
                )}
              </div>
              <div className="pt-1">
                <p
                  className={`text-sm font-medium ${
                    step.active ? "text-gold" : step.done ? "text-gold" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {step.active && (
                  <p className="text-xs text-gray-400 mt-0.5">In progress, Est. 2hrs</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-3 mt-3 bg-gold/10 rounded-xl p-3">
          <p className="text-xs text-gold font-medium text-center flex items-center justify-center gap-1.5">
            <MapPin className="w-3 h-3" />
            Estimated delivery: Today, 4:00 to 6:00 PM
          </p>
        </div>
      </div>
    ),
  },
];

export default function PhoneMockup() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex justify-center items-center">
      {/* Glow */}
      <div className="absolute inset-0 bg-gold/20 rounded-full blur-3xl scale-75 opacity-60" />

      {/* Phone frame */}
      <div className="relative w-[280px] h-[580px] bg-[#0F2A45] rounded-[44px] shadow-2xl border-[6px] border-[#1a3a55] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#0F2A45] rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="absolute inset-0 bg-[#F4F6FA] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={screens[current].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="h-full overflow-hidden"
            >
              {screens[current].content}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Dots */}
      <div className="absolute -bottom-8 flex gap-2">
        {screens.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current ? "bg-gold" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
