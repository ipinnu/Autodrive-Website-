import type { Metadata } from "next";
import WhySection from "@/components/WhySection";
import OurStoryInline from "@/components/OurStoryInline";
import CTASection from "@/components/CTASection";

export const metadata: Metadata = {
  title: "Why AutoDrive | AutoDrive Nigeria",
  description:
    "Why AutoDrive is different, who it's built for, and the story behind Nigeria's first centralized car document management platform.",
};

export default function WhyAutoDrivePage() {
  return (
    <>
      <section className="section-padding bg-navy text-white text-center">
        <div className="container-wide max-w-3xl">
          <p className="text-gold font-semibold tracking-widest uppercase text-sm mb-4">
            The Full Picture
          </p>
          <h1 className="font-lora text-4xl md:text-6xl font-bold leading-tight mb-6">
            Why AutoDrive{" "}
            <span className="text-gold">And Why It Matters</span>
          </h1>
          <p className="text-white/70 text-xl leading-relaxed">
            Every Nigerian driver knows the frustration: the endless queues, the expired papers, and the unreliable agents. AutoDrive exists because two people who lived that frustration decided to fix it. Here is what makes us different.
          </p>
        </div>
      </section>

      <WhySection />
      <OurStoryInline />
      <CTASection />
    </>
  );
}
