"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Image from "next/image";

const problems = [
  {
    image: "/images/sound-familiar/lagos-traffic.webp",
    alt: "A LASTMA officer on a road in Lagos",
    position: "50% 39%",
    title: "Avoid the LASTMA headache",
    body: "Most drivers only realize their papers have expired when they are pulled over. It isn't your fault, the system is designed to be forgotten until it's too late.",
  },
  {
    image: "/images/sound-familiar/checking-time.webp",
    alt: "A man checking his watch outside an office building",
    position: "50% 50%",
    title: "Save your working hours",
    body: "Renewing documents shouldn't require taking a day off to stand in the sun. Stop wasting your transport fare and energy on government office queues.",
  },
  {
    image: "/images/sound-familiar/driver-documents.webp",
    alt: "A woman reviewing paperwork behind the wheel of a parked car",
    position: "50% 50%",
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
          className="mb-10 text-center md:mb-14"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-navy mb-4">
            Sound Familiar?
          </h2>
          <p className="text-xl text-navy/60 max-w-2xl mx-auto">
            Millions of Nigerian Drivers face this every day.
          </p>
        </motion.div>

        <div className="mb-12 grid gap-4 md:grid-cols-3 md:gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex flex-col overflow-hidden rounded-[1.75rem] border border-[#dae5f4] bg-gradient-to-br from-white to-[#edf4ff] shadow-[0_18px_42px_-32px_rgba(18,49,107,0.35)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#eaf2ff]">
                <Image
                  src={problem.image}
                  alt={problem.alt}
                  fill
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: problem.position }}
                />
              </div>
              <div className="flex flex-1 flex-col p-6 lg:p-8">
                <span aria-hidden="true" className="mb-4 h-0.5 w-8 bg-gold" />
                <h3 className="mb-3 font-lora text-xl font-bold leading-snug text-navy">
                  {problem.title}
                </h3>
                <p className="text-[0.95rem] leading-relaxed text-navy/75">{problem.body}</p>
              </div>
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
          <ArrowDown className="h-6 w-6 text-gold" strokeWidth={2.5} />
          <p className="font-lora text-2xl font-semibold text-navy">
            AutoDrive fixes <span className="text-gold">all of this.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
