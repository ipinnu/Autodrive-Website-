"use client";

import { motion } from "framer-motion";
import { Lock, Smartphone, Shield } from "lucide-react";

const BETA_URL = "https://forms.gle/G3Z2agiFyVE1cEWj8";

const trustBadges = [
  { icon: Lock, label: "Secure" },
  { icon: Shield, label: "Nigerian Built" },
  { icon: Smartphone, label: "Beta Live" },
];

export default function CTASection() {
  return (
    <section className="section-padding bg-navy relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      <div className="container-wide relative z-10 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gold/20 text-gold text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-gold/30">
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            Beta Now Live, Limited Spots
          </div>

          <h2 className="font-lora text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Don&apos;t Get Caught With{" "}
            <span className="text-gold">Expired Papers</span> Again
          </h2>

          <p className="text-white/70 text-xl leading-relaxed mb-10">
            We&apos;re building AutoDrive to end the stress of vehicle paperwork. Join a growing community of Nigerians already in our beta for free and see how easy managing your car documents can be.
          </p>

          {/* CTA Button */}
          <motion.a
            href={BETA_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 bg-gold hover:bg-gold hover:text-navy text-white font-bold text-xl px-10 py-5 rounded-full transition-colors shadow-2xl shadow-gold/30 mb-4"
          >
            <Smartphone className="w-6 h-6" />
            Join the Android Beta
          </motion.a>

          <p className="text-white/50 text-sm mb-10">
            iOS version coming soon.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/70">
                <Icon className="w-5 h-5 text-gold" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
