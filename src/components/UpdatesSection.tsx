"use client";

import { motion } from "framer-motion";
import { Megaphone, Calendar, ArrowRight } from "lucide-react";

export type Update = {
  date: string;
  tag: string;
  tagColor: string;
  title: string;
  body: string;
  link?: { label: string; href: string };
};

const updates: Update[] = [
  {
    date: "June 12, 2025",
    tag: "Launch",
    tagColor: "bg-gold/15 text-gold border-gold/30",
    title: "AutoDrive Beta is Now Live on Android",
    body: "After two years of building and testing, our beta is now available on the Google Play Store. We have limited spots available for drivers in Nigeria who want to help us refine the experience.",
    link: { label: "Join the Beta", href: "https://forms.gle/G3Z2agiFyVE1cEWj8" },
  },
  {
    date: "May 2025",
    tag: "Partnership",
    tagColor: "bg-navy/10 text-navy border-navy/20",
    title: "Government Partnership Conversations Begin",
    body: "We held our first internal meetings concerning partnership with Lagos State Business Development office and the Akure Government House. These discussions focused on making AutoDrive the digital backbone for vehicle document management across the country.",
  },
  {
    date: "March 2025",
    tag: "Product",
    tagColor: "bg-gold/15 text-gold border-gold/30",
    title: "Flutterwave Payment Integration Complete",
    body: "You can now pay for document renewals and services directly in the app. This integration removes the need for middlemen or cash transactions. You can simply tap and pay to have your documents handled.",
  },
  {
    date: "January 2025",
    tag: "Product",
    tagColor: "bg-gold/15 text-gold border-gold/30",
    title: "Version 3 Ships: Login, Car Profiles, and Document Tracking",
    body: "Our third major version introduced secure login, full car profiles, and document expiry tracking. Feedback from early testers helped us confirm that the platform is solving the right problems.",
  },
  {
    date: "December 25, 2024",
    tag: "Milestone",
    tagColor: "bg-gold/15 text-gold border-gold/30",
    title: "Version 2 Launched: First App and Initial Users",
    body: "We released a working app featuring a central hub. This allowed us to gather our first set of real world feedback from drivers using the platform.",
  },
];

export default function UpdatesSection() {
  return (
    <section className="section-padding bg-off-white">
      <div className="container-wide max-w-3xl">
        {updates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <Megaphone className="w-16 h-16 text-navy/20 mx-auto mb-6" />
            <h2 className="font-lora text-2xl font-bold text-navy mb-3">
              Big things are coming.
            </h2>
            <p className="text-navy/60 text-lg">
              We&apos;re heads down building. Check back soon, we&apos;ll be dropping news here first.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-lora text-3xl md:text-4xl font-bold text-navy text-center mb-2"
            >
              Our <span className="text-gold">Journey</span>
            </motion.h2>
            {updates.map((update, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${update.tagColor}`}
                  >
                    {update.tag}
                  </span>
                  <span className="flex items-center gap-1.5 text-navy/40 text-sm">
                    <Calendar className="w-4 h-4" />
                    {update.date}
                  </span>
                </div>

                <h2 className="font-lora font-bold text-xl text-navy mb-3 leading-snug">
                  {update.title}
                </h2>
                <p className="text-navy/65 leading-relaxed mb-4">{update.body}</p>

                {update.link && (
                  <a
                    href={update.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold font-semibold text-sm hover:gap-3 transition-all"
                  >
                    {update.link.label}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
