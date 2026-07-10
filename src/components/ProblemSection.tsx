"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Clock, FileX, ArrowDown } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "Avoid the LASTMA headache",
    body: "Most drivers only realize their papers have expired when they are pulled over. It isn't your fault, the system is designed to be forgotten until it's too late.",
  },
  {
    icon: Clock,
    title: "Save your working hours",
    body: "Renewing documents shouldn't require taking a day off to stand in the sun. Stop wasting your transport fare and energy on government office queues.",
  },
  {
    icon: FileX,
    title: "End the paper chase",
    body: "Tracking your license, insurance, and roadworthiness certificates is a constant struggle. Stop digging through your glove box or home files to find what you need.",
  },
];

export default function ProblemSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-navy mb-4">
            Sound Familiar?
          </h2>
          <p className="text-xl text-navy/60 max-w-2xl mx-auto">
            Millions of Nigerian Drivers face this every day.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-red-50 border border-red-100 rounded-3xl p-7 hover:shadow-lg transition-shadow"
            >
              <div className="mb-4"><problem.icon className="w-10 h-10 text-gold" /></div>
              <h3 className="font-lora font-bold text-lg text-navy mb-3 leading-snug">
                {problem.title}
              </h3>
              <p className="text-navy/65 leading-relaxed">{problem.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Arrow + fix */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <ArrowDown className="w-8 h-8 text-gold animate-bounce" strokeWidth={2.5} />
          <p className="font-lora text-2xl font-semibold text-navy">
            AutoDrive fixes <span className="text-gold">all of this.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
