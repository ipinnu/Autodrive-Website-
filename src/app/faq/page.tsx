import type { Metadata } from "next";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";

export const metadata: Metadata = {
  title: "FAQ | AutoDrive Nigeria",
  description:
    "Straight answers to the questions every Nigerian driver asks about AutoDrive. No jargon, no runaround.",
};

export default function FAQPage() {
  return (
    <>
      <section className="section-padding bg-navy text-white text-center">
        <div className="container-wide max-w-3xl">
          <p className="text-gold font-semibold tracking-widest uppercase text-sm mb-4">
            Got Questions?
          </p>
          <h1 className="font-lora text-4xl md:text-6xl font-bold leading-tight mb-6">
            Frequently Asked{" "}
            <span className="text-gold">Questions</span>
          </h1>
          <p className="text-white/70 text-xl leading-relaxed">
            No jargon. No runaround. Just straight answers to everything people
            ask us about AutoDrive.
          </p>
        </div>
      </section>

      <FAQSection />
      <CTASection />
    </>
  );
}
