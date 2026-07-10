"use client";

import { motion } from "framer-motion";
import { Car, Award, FileWarning, PackageCheck } from "lucide-react";

const stats = [
  { value: "12M+", label: "Registered vehicles in Nigeria", icon: Car },
  { value: "2M+", label: "Annual document renewals in Lagos alone", icon: PackageCheck },
  { value: "75%", label: "Of cars have expired papers, FRSC and NIA", icon: FileWarning },
  { value: "1st", label: "Nationwide automated delivery first solution", icon: Award },
];

export default function IntroSection() {
  return (
    <section className="bg-navy section-padding">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-white mb-6">
            Everything You Need,{" "}
            <span className="text-gold">In One App.</span>
          </h2>
          <p className="text-white/70 text-xl leading-relaxed max-w-3xl mx-auto">
            AutoDrive is a Nigerian-built mobile app that puts your entire car
            life in one place. We remind you before anything expires. We renew
            your papers without you standing in a queue. We deliver your
            documents to your door. Whether you own one car or manage a fleet,
            AutoDrive was made for you.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center hover:bg-white/10 transition-colors"
            >
              <Icon className="w-7 h-7 text-gold mx-auto mb-3" />
              <p className="font-lora font-bold text-4xl text-gold mb-2">{value}</p>
              <p className="text-white/65 text-sm leading-relaxed">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
