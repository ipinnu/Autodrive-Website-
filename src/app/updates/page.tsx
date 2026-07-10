import type { Metadata } from "next";
import TractionSection from "@/components/TractionSection";
import UpdatesSection from "@/components/UpdatesSection";
import CTASection from "@/components/CTASection";

export const metadata: Metadata = {
  title: "Updates | AutoDrive Nigeria",
  description:
    "The latest news, milestones, and announcements from AutoDrive Nigeria. We build in public, follow our journey here.",
};

export default function UpdatesPage() {
  return (
    <>
      {/* Page hero */}
      <section className="section-padding bg-navy text-white text-center">
        <div className="container-wide max-w-3xl">
          <p className="text-gold font-semibold tracking-widest uppercase text-sm mb-4">
            What&apos;s New
          </p>
          <h1 className="font-lora text-4xl md:text-6xl font-bold leading-tight mb-6">
            AutoDrive{" "}
            <span className="text-gold">Updates</span>
          </h1>
          <p className="text-white/70 text-xl leading-relaxed">
            We build in the open. You can find every milestone, launch, and update right here as they happen. Follow our journey as we change the way Nigeria manages its cars.
          </p>
        </div>
      </section>

      <TractionSection />
      <UpdatesSection />
      <CTASection />
    </>
  );
}
