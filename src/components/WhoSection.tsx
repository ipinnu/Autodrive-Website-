"use client";

import { motion } from "framer-motion";
import { Users, Building2, Briefcase } from "lucide-react";

const personas = [
  {
    icon: Users,
    title: "The Family Driver",
    subtitle: "For every parent managing the house car",
    body: "Manage cars for the whole house. AutoDrive reminds you before the car becomes a problem on the road. No more asking, \"Honey, did you remember to renew the vehicle license?\"",
  },
  {
    icon: Building2,
    title: "Communities & Groups",
    subtitle: "Churches, estates, and workplaces",
    body: "We partner with trusted organizations for on-site renewals and referral rewards. Whether it is your church, estate, or workplace, we bring the service directly to your community.",
  },
  {
    icon: Briefcase,
    title: "Fleet & Business Owners",
    subtitle: "Manage every vehicle in one place",
    body: "Uber drivers, logistics companies, and corporate fleets can manage every vehicle from one central dashboard. Scale your operations without the administrative stress.",
  },
];

export default function WhoSection() {
  return (
    <section className="section-padding bg-navy">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-white mb-4">
            AutoDrive Is for{" "}
            <span className="text-gold">Every Nigerian</span> Who Owns a
            Car
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((persona, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-7 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-5"><persona.icon className="w-12 h-12 text-gold" /></div>
              <h3 className="font-lora font-bold text-xl text-white mb-1">
                {persona.title}
              </h3>
              <p className="text-gold text-sm font-medium mb-4">
                {persona.subtitle}
              </p>
              <p className="text-white/65 leading-relaxed text-sm">
                {persona.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
