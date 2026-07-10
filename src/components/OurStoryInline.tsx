"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const founders = [
  {
    name: "Victor Tadese",
    role: "Co-Founder & CEO",
    bio: "As a graduate of Afe Babalola University with a background in tech and design, Victor serves as the operational lead for AutoDrive. Managing the essential workflows of the business, coordinating logistics and agent partnerships to the brand's visual identity.",
    photo: "/images/founder-victor.png",
  },
  {
    name: "Ipinnuoluwa Oladipo",
    role: "Co-Founder & CTO",
    bio: "A product engineer and manager who found his passion for technology in his final year of university. He runs a tech agency and leads AutoDrive's product development, making sure the product works, ships, and actually serves the people it was built for.",
    photo: "/images/founder-ipinnu.jpg",
  },
];

const advisor = {
  name: "Fehintoluwa Dada",
  role: "Technical Partner, Product Strategy & Digital Transformation",
  bio: "Fehintoluwa Dada is a UK based IT Business Analyst and Digital Product Strategist who helps teams turn complex ideas into clear, usable digital products. She supports AutoDrive with product structure, user experience, research, and process thinking, bringing a practical outside lens to how the platform can scale for real Nigerian drivers, agents, and partners.",
  photo: "/images/advisor-fehintoluwa.jpeg",
};

export default function OurStoryInline() {
  return (
    <section id="our-story" className="section-padding bg-off-white">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-gold font-semibold tracking-widest uppercase text-sm mb-4">The People Behind AutoDrive</p>
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-navy mb-4">
            We Didn&apos;t Study This Problem{" "}
            <span className="text-gold">We Lived It</span>
          </h2>
          <p className="text-navy/60 text-lg max-w-2xl mx-auto">
            AutoDrive isn&apos;t a corporate product built in a boardroom. It was built by two Nigerian drivers who got tired of the same broken system you&apos;re navigating right now.
          </p>
        </motion.div>

        {/* Story text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
            <p className="text-lg text-navy/75 leading-relaxed mb-6">
              It started with one question on May 12, 2023: <em>why is renewing car papers in Nigeria still this convoluted?</em> Two friends, Ipinnuoluwa and Victor, decided to stop complaining and start building AutoDrive. What began as a simple Google Sheet and a maintenance tracker has evolved through four major versions into the fully functional app available on the Google Play Store today.
            </p>
            <p className="text-lg text-navy/75 leading-relaxed">
              They didn&apos;t start with venture capital or big tech backing. They built this through late nights, failed prototypes, and two years of constant iteration. By late 2024, they had their first working model. By 2025, they were engaging in partnership talks with authorities in Lagos and Akure. Today, they are growing a community of drivers who are finally ready for a better way to stay on the road.
            </p>
          </div>
        </motion.div>

        {/* Founders */}
        <h3 className="font-lora text-2xl font-bold text-navy text-center mb-10">
          Meet the Founders
        </h3>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {founders.map((founder, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="relative h-[420px] w-full">
                <Image
                  src={founder.photo}
                  alt={founder.name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <h4 className="font-lora font-bold text-xl text-white">{founder.name}</h4>
                  <p className="text-gold font-semibold text-sm">{founder.role}</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-navy/65 leading-relaxed">{founder.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Technical partner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-navy rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="grid md:grid-cols-[320px_1fr]">
            <div className="relative h-[360px] md:h-full min-h-[360px]">
              <Image
                src={advisor.photo}
                alt={advisor.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 320px"
              />
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <p className="text-gold font-semibold tracking-widest uppercase text-sm mb-3">
                Technical Partner
              </p>
              <h3 className="font-lora text-3xl font-bold text-white mb-2">
                {advisor.name}
              </h3>
              <p className="text-gold font-semibold mb-5">{advisor.role}</p>
              <p className="text-white/70 leading-relaxed">{advisor.bio}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
