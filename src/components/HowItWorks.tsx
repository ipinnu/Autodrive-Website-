"use client";

import { motion } from "framer-motion";
import { Download, Car, Bell, CreditCard } from "lucide-react";
import Image from "next/image";

function IPhoneFrame({ src, alt, cropPosition = "top" }: { src: string; alt: string; cropPosition?: string }) {
  return (
    <div className="mx-auto w-[170px]">
      <div className="relative bg-[#1a1a1a] rounded-[2.6rem] p-[3px] shadow-2xl shadow-black/40">
        <div className="relative bg-black rounded-[2.4rem] overflow-hidden h-[370px]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            style={{ objectPosition: cropPosition }}
            sizes="170px"
          />

        </div>
      </div>
    </div>
  );
}

const steps = [
  {
    number: "01",
    icon: Download,
    title: "Download & Sign Up",
    body: "Create your AutoDrive account in minutes. Just add your name, phone number, and your driver's licence details to get started.",
    numColor: "text-gold",
    accent: "border-gold/30",
    iconColor: "bg-gold/10 text-gold",
    image: { src: "/images/frame-565.png", alt: "AutoDrive splash screen", cropPosition: "top" },
  },
  {
    number: "02",
    icon: Car,
    title: "Add a Car",
    body: 'Enter your car details once. You can add multiple cars and give each one a nickname like "Daddy\'s Jeep" or "The Family Car."',
    numColor: "text-navy",
    accent: "border-navy/20",
    iconColor: "bg-navy/10 text-navy",
    image: { src: "/images/add-car.jpeg", alt: "AutoDrive add car form", cropPosition: "center" },
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Renew With One Tap",
    body: "See exactly what is due. Tap to renew and we handle the processing and delivery straight to your Lagos doorstep within 48 hours.",
    numColor: "text-gold",
    accent: "border-gold/30",
    iconColor: "bg-gold/10 text-gold",
    image: { src: "/images/frame-567.png", alt: "Renewal order with live tracking", cropPosition: "top" },
  },
  {
    number: "04",
    icon: Bell,
    title: "Track Your Orders",
    body: "AutoDrive tracks your expiry dates and sets up automated reminders. We keep you compliant so you can drive with confidence.",
    numColor: "text-gold",
    accent: "border-gold/40",
    iconColor: "bg-gold/20 text-gold",
    image: { src: "/images/frame-571.png", alt: "Car profile showing document expiry status", cropPosition: "bottom" },
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-off-white">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-navy mb-4">
            Getting Started With{" "}
            <span className="text-gold">AutoDrive</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              <div className={`bg-white rounded-3xl border-2 ${step.accent} hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden`}>
                <div className="pt-8 pb-4 px-4 bg-gray-50 flex justify-center">
                  <IPhoneFrame {...step.image} />
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`font-lora font-bold text-5xl leading-none ${step.numColor}`}>
                      {step.number}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step.iconColor}`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-lora font-bold text-xl text-navy mb-3">{step.title}</h3>
                  <p className="text-navy/65 leading-relaxed text-[15px]">{step.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
