"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const benefits = [
  { title: "Check your papers", detail: "Enter your plate number to see recorded expiry dates.", image: "/images/home-benefits/check-papers.webp" },
  { title: "Get a reminder", detail: "Know when your next renewal is due.", image: "/images/home-benefits/reminder.webp" },
  { title: "Renew online", detail: "Renew from your phone without taking time off to queue.", image: "/images/home-benefits/renew-online.webp" },
  { title: "Get them delivered", detail: "Receive your renewed papers at your door in Lagos.", image: "/images/home-benefits/delivery.webp" },
];

export default function IntroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-navy px-4 pb-24 pt-16 md:px-8 md:pb-32 md:pt-20 lg:px-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_0%,black_28%,transparent_100%)] bg-[radial-gradient(ellipse_at_top,rgba(161,130,74,0.22),transparent_64%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(45deg,transparent_0_34px,rgba(218,185,118,0.14)_34px_35px),repeating-linear-gradient(-45deg,transparent_0_34px,rgba(218,185,118,0.14)_34px_35px)] [mask-image:linear-gradient(to_right,black,transparent_40%,transparent_60%,black),linear-gradient(to_bottom,black_0%,black_28%,transparent_100%)] [mask-composite:intersect]"
      />
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center md:mb-12"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-white mb-6">
            Everything You Need,{" "}
            <span className="text-[#e3c68e]">In One App.</span>
          </h2>
          <p className="text-white/70 text-xl leading-relaxed max-w-3xl mx-auto">
            <span className="font-semibold text-[#e3c68e]">Track expiry dates</span> and get reminders before your papers are due.{" "}
            <span className="font-semibold text-[#e3c68e]">Renew online</span> and get your papers delivered in Lagos, whether you have one car or manage a fleet.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {benefits.map(({ title, detail, image }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-3xl border border-[#d9b976]/20 bg-[#102958]/80 p-4 text-center transition-colors hover:border-[#d9b976]/40 sm:p-6"
            >
              <div className="relative mx-auto mb-4 aspect-[18/13] w-full max-w-[9rem] overflow-hidden rounded-xl bg-[#183567] ring-1 ring-white/10 sm:max-w-[11rem]">
                <Image src={image} alt="" fill sizes="(min-width: 640px) 176px, 144px" className="object-cover" />
              </div>
              <h3 className="mb-2 font-lora text-base font-bold text-[#e3c68e] sm:text-lg">{title}</h3>
              <p className="text-white/75 text-sm leading-relaxed">{detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
