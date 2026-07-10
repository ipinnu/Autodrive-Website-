"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is AutoDrive safe and official?",
    a: "Yes. We process all renewals through licensed agents and official government channels. Payments are handled securely via Flutterwave, and every document issued is authentic and verifiable.",
  },
  {
    q: "How long does renewal take?",
    a: "Digital copies are available in the app as soon as processing is complete. For physical documents, we deliver to your doorstep within 24 to 48 hours in Lagos.",
  },
  {
    q: "What documents can AutoDrive renew?",
    a: "You can currently renew your Vehicle License, Motor Insurance, Roadworthiness Certificate, TIN, and Proof of Ownership. We are regularly adding more services based on user feedback.",
  },
  {
    q: "Is the app free to use?",
    a: "The beta is free to download and join. You only pay for the actual cost of your document renewals plus a standard service and delivery fee. We do not have any hidden charges.",
  },
  {
    q: "I'm not very tech savvy. Can I still use it?",
    a: "AutoDrive is designed to be straightforward and we ensure that the app is easy to navigate. It has been tested across all age groups to ensure it remains intuitive.",
  },
  {
    q: "What cities do you currently serve?",
    a: "We currently offer physical delivery and processing in Lagos. We are expanding to other major cities across Nigeria soon.",
  },
  {
    q: "Can I manage more than one car?",
    a: "Yes. You can add multiple vehicles to a single account, give each one a nickname, and track all their documents. Whether you have one car or a fleet, the app organizes them all for you.",
  },
  {
    q: "What happens if there is an issue with my renewal?",
    a: "We provide support directly through the app or via email at autodrive.ng@gmail.com. Every transaction has a unique reference number, and reprocessing or refunds can be initiated if an order is not completed adequately.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gold/40 transition-colors"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-7 py-5 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-lora font-semibold text-lg text-navy pr-4 leading-snug">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-gold" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-6 pt-1 bg-white">
              <p className="text-navy/70 leading-relaxed text-[17px]">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  return (
    <section id="faq" className="section-padding bg-off-white">
      <div className="container-wide max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-navy mb-4">
            Questions People Ask{" "}
            <span className="text-gold">Us All the Time</span>
          </h2>
          <p className="text-xl text-navy/60">
            No jargon. Just straight answers.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
