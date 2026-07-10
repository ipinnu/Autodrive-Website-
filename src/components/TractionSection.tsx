"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Check, Hourglass, TrendingUp } from "lucide-react";

const achieved = [
  "Fully functional MVP is live on Google Play Store",
  "Digital document delivery is now active",
  "Logistics partnerships in place for physical delivery in Lagos",
  "Government meetings with Lagos State Business Development + Akure Government House",
  "Secure payments fully integrated with Flutterwave",
  "Second round of user testing is currently underway",
];

const coming = [
  "Launch on the Apple App Store",
  "In app payment for vehicle fines",
  "Automatic renewal system in development",
  "24 to 48 hour physical delivery rolling out across Lagos",
];

export default function TractionSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-navy mb-4">
            What We&apos;ve{" "}
            <span className="text-gold">Built</span> and What&apos;s Coming
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Achieved */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-green-50 border border-green-100 rounded-3xl p-8"
          >
            <h3 className="font-lora font-bold text-xl text-navy mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-gold" />
              What We&apos;ve Built
            </h3>
            <ul className="space-y-4">
              {achieved.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-navy/75 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Coming soon */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gold/5 border border-gold/20 rounded-3xl p-8"
          >
            <h3 className="font-lora font-bold text-xl text-navy mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-gold" />
              What&apos;s Coming
            </h3>
            <ul className="space-y-4 mb-8">
              {coming.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Hourglass className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-navy/75 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-gold/10 rounded-2xl p-4">
              <p className="text-sm text-gold font-semibold text-center flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                NGN 500K+ projected early revenue, Growing waitlist
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
