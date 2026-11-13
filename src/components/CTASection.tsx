"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Smartphone, Shield } from "lucide-react";

const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.ipinnu.AutodriveNew";

const trustBadges = [
  { icon: Lock, label: "Secure" },
  { icon: Shield, label: "Verified" },
  { icon: Smartphone, label: "Available on Android" },
];

export default function CTASection({ showLaunchBadges = true, compact = false }: { showLaunchBadges?: boolean; compact?: boolean }) {
  return (
    <section className={compact ? "relative bg-navy px-4 pb-16 md:px-8 md:pb-24 lg:px-16" : "section-padding bg-navy relative overflow-hidden"}>
      {!compact && (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        </>
      )}

      <div className="container-wide relative z-10 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {showLaunchBadges && (
          <div className="inline-flex items-center gap-2 bg-gold/20 text-gold text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-gold/30">
            AutoDrive Is Live
          </div>
          )}

          {compact ? (
            <h2 className="mb-6 font-lora text-3xl font-semibold text-white sm:text-4xl">
              Get AutoDrive on Android
            </h2>
          ) : (
            <>
              <h2 className="font-lora text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Don&apos;t Get Caught With{" "}
                <span className="text-gold">Expired Papers</span> Again
              </h2>
              <p className="text-white/70 text-xl leading-relaxed mb-10">
                Track expiry dates, renew your vehicle papers, and get them delivered. Manage it all with AutoDrive on Android.
              </p>
            </>
          )}

          {/* CTA Button */}
          <motion.a
            href={ANDROID_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex min-h-14 w-full sm:w-auto items-center justify-center gap-3 bg-white hover:bg-white/90 text-navy font-bold text-base sm:text-xl px-6 sm:px-10 py-5 rounded-full transition-colors shadow-2xl mb-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <svg width="24" height="26" viewBox="0 0 24 26" fill="none" aria-hidden="true" className="shrink-0">
              <path d="M1 1L14 13L1 25V1Z" fill="#4285F4" />
              <path d="M1 1L17.5 10L14 13L1 1Z" fill="#34A853" />
              <path d="M1 25L14 13L17.5 16L1 25Z" fill="#EA4335" />
              <path d="M14 13L17.5 10L23 13L17.5 16L14 13Z" fill="#FBBC04" />
            </svg>
            Get AutoDrive on Google Play
          </motion.a>

          <p className="text-white/80 text-sm sm:text-base mb-10">
            Not using Android?{" "}
            <Link href="/renew/welcome" className="font-semibold text-white underline underline-offset-4 hover:text-gold">Renew your papers on our website</Link>.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6">
            {trustBadges.filter(({ icon }) => showLaunchBadges || icon !== Smartphone).map(({ icon: Icon, label }) => (
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
