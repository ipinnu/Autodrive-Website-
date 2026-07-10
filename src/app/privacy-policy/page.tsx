import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AutoDrive Nigeria",
  description: "How AutoDrive Automobile Services Ltd collects, uses, and protects your personal information.",
};

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      {
        subtitle: "Personal Information",
        text: "When you create an account or use our services, we collect your name, email address, phone number, and other contact details.",
      },
      {
        subtitle: "Payment Information",
        text: "We collect payment details (such as credit card information) to process transactions. These details are processed securely by our third party payment processors.",
      },
      {
        subtitle: "Documents and Images",
        text: "You may upload images and scanned documents such as your driver's license, vehicle registration, and other documents required for renewals.",
      },
      {
        subtitle: "Location Data",
        text: "We may collect location data through the mobile application to provide location based services (e.g., for delivery or to identify the nearest service center).",
      },
      {
        subtitle: "Cookies and Tracking Technologies",
        text: "We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and customize content and advertisements.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      { subtitle: "Service Provision", text: "To process document renewals, manage your account, and fulfill orders for physical and digital vehicle documents and driver's licenses." },
      { subtitle: "Communication", text: "To send you account related notifications, service updates, reminders about document renewals, and customer support communications." },
      { subtitle: "Third Party Sharing", text: "We may share your data with third party service providers to process payments, fulfill document renewals, and for other operational purposes. These third parties are contractually obligated to protect your data and use it solely for the services we provide." },
      { subtitle: "Marketing and Promotional Purposes", text: "With your consent, we may use your contact information to send you promotional emails or push notifications regarding new services, discounts, or updates. You can opt out of marketing communications at any time." },
    ],
  },
  {
    title: "3. How We Protect Your Information",
    content: [
      { subtitle: "Security Measures", text: "We implement appropriate physical, technical, and organizational security measures to protect your personal information from unauthorized access, alteration, or destruction." },
      { subtitle: "Data Retention", text: "We retain your personal information for as long as we deem necessary to fulfill the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce our agreements." },
      { subtitle: "Encryption and Data Security Protocols", text: "We use encryption and secure servers to protect sensitive data, such as payment information and personal documents, during transmission." },
    ],
  },
  {
    title: "4. User Rights and Control",
    content: [
      { subtitle: "Accessing and Updating Your Data", text: "You can access, update, or modify your personal data by logging into your account or contacting us at any time." },
      { subtitle: "Deleting Your Data", text: "You can request that we delete your personal data, provided that the deletion does not conflict with any legal obligations or business requirements we have to retain it." },
      { subtitle: "Opt Out Options", text: "If you no longer wish to receive marketing emails or other promotional communications, you can opt out by clicking the unsubscribe link in the email or through the in app settings." },
      { subtitle: "Managing Cookies", text: "You can manage your cookie preferences through the settings of your browser, depending on the platform you are using." },
    ],
  },
  {
    title: "5. Sharing of Information with Third Parties",
    content: [
      { subtitle: "Service Providers", text: "We work with third party partners to process payments, fulfill orders, and provide customer support services. These partners are required to handle your data securely and only for the purpose of fulfilling their role in our service delivery." },
      { subtitle: "Legal and Regulatory Compliance", text: "We may share your information with authorities or other third parties if required to comply with a legal obligation, resolve disputes, or protect our rights." },
      { subtitle: "Business Transfers", text: "In the event of a merger, acquisition, or sale of assets, your personal information may be transferred to the new owner or operator of the business." },
    ],
  },
  {
    title: "6. Legal Compliance",
    content: [
      { subtitle: "GDPR Compliance (for EU users)", text: "Although we do not serve users outside of Nigeria at this time, if this changes in the future, we will comply with applicable GDPR regulations for users in the EU." },
      { subtitle: "Nigerian Data Protection Compliance", text: "We comply with the Nigeria Data Protection Regulation (NDPR), ensuring that your data is handled in accordance with Nigerian privacy laws." },
      { subtitle: "Children's Privacy", text: "Our services are not intended for individuals under the legal driving age in Nigeria, which is 18. We do not knowingly collect or solicit personal data from children under this age." },
    ],
  },
  {
    title: "7. Changes to This Privacy Policy",
    content: [
      { subtitle: "", text: "We may update this Privacy Policy from time to time to reflect changes in our services or legal obligations. When we make changes, we will update the 'Last Updated' date at the top of the policy. You will be notified of significant changes via email or through the platform. By continuing to use our services after we post changes, you accept and agree to the updated Privacy Policy." },
    ],
  },
  {
    title: "8. Contact Us",
    content: [
      { subtitle: "", text: "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at autodrive.ng@gmail.com or call +234 813 375 4181. Customer Support Hours: Monday to Friday, 9:00 AM to 5:00 PM (WAT)." },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="section-padding bg-navy text-white text-center">
        <div className="container-wide max-w-3xl">
          <p className="text-gold font-semibold tracking-widest uppercase text-sm mb-4">Legal</p>
          <h1 className="font-lora text-4xl md:text-5xl font-bold leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/60 text-base">Last Updated: April 30, 2025</p>
        </div>
      </section>

      <section className="section-padding bg-off-white">
        <div className="container-wide max-w-3xl">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-8">
            <p className="text-navy/75 leading-relaxed text-lg">
              This website is owned and operated by <strong>AUTODRIVE AUTOMOBILE SERVICES LTD</strong> (&ldquo;Autodrive&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). At Autodrive Automobile Services, we are committed to protecting and respecting your privacy. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our services, including our website and mobile application. By using our platform, you consent to the practices described in this policy.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
                <h2 className="font-lora text-2xl font-bold text-navy mb-6">{section.title}</h2>
                <div className="space-y-5">
                  {section.content.map((item, j) => (
                    <div key={j}>
                      {item.subtitle && (
                        <h3 className="font-semibold text-navy mb-1">{item.subtitle}</h3>
                      )}
                      <p className="text-navy/70 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
