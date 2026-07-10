import type { Metadata } from "next";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";

export const metadata: Metadata = {
  title: "Features | AutoDrive Nigeria",
  description:
    "How AutoDrive works and everything it can do for you, including document renewals, smart reminders, fine payments, and doorstep delivery.",
};

export default function FeaturesPage() {
  return (
    <>
      <section className="section-padding bg-navy text-white text-center">
        <div className="container-wide max-w-3xl">
          <p className="text-gold font-semibold tracking-widest uppercase text-sm mb-4">
            Everything You Need
          </p>
          <h1 className="font-lora text-4xl md:text-6xl font-bold leading-tight mb-6">
            What AutoDrive{" "}
            <span className="text-gold">Can Do For You</span>
          </h1>
          <p className="text-white/70 text-xl leading-relaxed">
            Four steps to get started, and six features to keep you road legal.
          </p>
        </div>
      </section>

      <HowItWorks />
      <FeaturesSection />
      <CTASection />
    </>
  );
}
