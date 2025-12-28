import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const lastUpdated = "December 27, 2025";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-xl">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-sm max-w-none"
        >
          <p className="text-muted-foreground text-sm mb-6">Last updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Laten ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services (collectively, the "Service").
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We comply with the General Data Protection Regulation (GDPR) and other applicable data protection laws. By using our Service, you consent to the data practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Account information (email address, display name, date of birth)</li>
              <li>Profile information (avatar, bio, city preferences, interests)</li>
              <li>Event information (if you are a host: event details, location, descriptions)</li>
              <li>Communications (messages, reports, feedback)</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2 mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Device information (device type, operating system, unique identifiers)</li>
              <li>Usage data (features used, events viewed, interactions)</li>
              <li>Location data (with your permission, for nearby event discovery)</li>
              <li>Log data (IP address, access times, pages viewed)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We use your information for the following purposes:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide, maintain, and improve our Service</li>
              <li>To personalize your experience and show relevant events</li>
              <li>To process transactions and send related information</li>
              <li>To communicate with you about updates, promotions, and support</li>
              <li>To ensure safety and security of our platform and users</li>
              <li>To comply with legal obligations</li>
              <li>To enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">4. Legal Basis for Processing (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Under GDPR, we process your data based on:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Consent:</strong> When you create an account and agree to this policy</li>
              <li><strong>Contract:</strong> To fulfill our service agreement with you</li>
              <li><strong>Legitimate Interests:</strong> To improve our services and ensure platform safety</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">5. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">As a user in the European Union, you have the following rights:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong>Right to Restriction:</strong> Request limitation of data processing</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@latenapp.com" className="text-primary hover:underline">privacy@latenapp.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">6. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We may share your information with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Event Hosts:</strong> Your RSVP status and basic profile info for events you attend</li>
              <li><strong>Service Providers:</strong> Third parties who assist in operating our Service (hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do NOT sell your personal data to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for up to 30 days for backup purposes and as required by law. Anonymized data may be retained for analytics.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">8. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data, including encryption, secure servers, and access controls. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data may be transferred to and processed in countries outside the European Economic Area (EEA). We ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">10. Age Restrictions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is intended for users who are 18 years of age or older. We do not knowingly collect personal data from individuals under 18. If we learn that we have collected data from someone under 18, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If you have questions about this Privacy Policy or wish to exercise your rights, contact us:
            </p>
            <div className="glass-card p-4">
              <p className="text-sm"><strong>Email:</strong> <a href="mailto:privacy@latenapp.com" className="text-primary hover:underline">privacy@latenapp.com</a></p>
              <p className="text-sm mt-2"><strong>Data Protection Officer:</strong> <a href="mailto:dpo@latenapp.com" className="text-primary hover:underline">dpo@latenapp.com</a></p>
              <p className="text-sm mt-2"><strong>Supervisory Authority:</strong> You have the right to lodge a complaint with the Hungarian National Authority for Data Protection and Freedom of Information (NAIH) or your local supervisory authority.</p>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
