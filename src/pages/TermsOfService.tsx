import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService: React.FC = () => {
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
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-xl">Terms of Service</h1>
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

          {/* Important Disclaimer Banner */}
          <div className="glass-card p-4 mb-8 border-l-4 border-yellow-500">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-500 mb-1">Important Notice</h3>
                <p className="text-sm text-muted-foreground">
                  Laten is an event discovery platform only. We do NOT organize, host, or take responsibility for any events listed on our platform. All events are organized by independent third-party hosts.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Laten (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. We reserve the right to modify these Terms at any time. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">2. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">To use our Service, you must:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into a binding agreement</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              By using the Service, you represent and warrant that you meet all eligibility requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">3. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Laten is a platform that allows users to discover events, parties, and social gatherings ("Events") organized by third-party hosts ("Hosts"). We provide a venue for Hosts to advertise their Events and for users to find and RSVP to Events.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3 font-semibold">
              Laten is NOT an event organizer, promoter, or venue operator. We do not organize, manage, control, or supervise any Events listed on our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">4. Event Disclaimer and Liability</h2>
            
            <div className="glass-card p-4 mb-4 border border-destructive/30 bg-destructive/5">
              <h3 className="font-semibold text-destructive mb-2">IMPORTANT: EVENT LIABILITY DISCLAIMER</h3>
              <p className="text-sm text-muted-foreground">
                LATEN IS NOT RESPONSIBLE FOR ANY EVENTS LISTED ON THE PLATFORM. ALL EVENTS ARE ORGANIZED AND MANAGED SOLELY BY INDEPENDENT THIRD-PARTY HOSTS.
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-3">By using our Service, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Laten does not verify, endorse, or guarantee any Events, Hosts, venues, or attendees</li>
              <li>Laten is not responsible for the accuracy of Event information provided by Hosts</li>
              <li>Laten is not liable for any injuries, damages, losses, or harm that may occur at any Event</li>
              <li>Laten is not responsible for the actions, conduct, or behavior of Hosts, attendees, or any third parties</li>
              <li>Attendance at any Event is at your own risk</li>
              <li>You are solely responsible for your safety and well-being at any Event</li>
              <li>Laten is not responsible for Event cancellations, changes, or refunds</li>
              <li>Laten does not guarantee the quality, safety, or legality of any Event</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">5. Host Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">If you are a Host, you agree to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete information about your Events</li>
              <li>Comply with all applicable laws, regulations, and permit requirements</li>
              <li>Ensure your Events are safe and appropriate for attendees</li>
              <li>Obtain all necessary licenses, permits, and insurance for your Events</li>
              <li>Be solely responsible for the organization, management, and conduct of your Events</li>
              <li>Indemnify and hold Laten harmless from any claims arising from your Events</li>
              <li>Not engage in illegal activities or promote such activities</li>
              <li>Comply with age restrictions and verify attendee ages where required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">6. User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">As a user, you agree to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate information and maintain the security of your account</li>
              <li>Attend Events at your own risk and exercise reasonable judgment</li>
              <li>Comply with all rules and requirements set by Event Hosts and venues</li>
              <li>Not engage in harassment, discrimination, or illegal activities</li>
              <li>Report any suspicious or dangerous Events or users</li>
              <li>Not use the Service to organize or promote illegal activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">7. Content and Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Users and Hosts retain ownership of content they submit to the Service. By submitting content, you grant Laten a worldwide, non-exclusive, royalty-free license to use, display, and distribute such content in connection with the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You may not upload content that infringes on intellectual property rights, is illegal, harmful, or violates these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">8. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You may not:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Post false, misleading, or fraudulent Event information</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Scrape, data mine, or collect user information</li>
              <li>Promote illegal substances, weapons, or activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LATEN AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO PERSONAL INJURY, PROPERTY DAMAGE, LOSS OF DATA, LOSS OF REVENUE, OR ANY OTHER DAMAGES ARISING FROM:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
              <li>Your use or inability to use the Service</li>
              <li>Any Events listed on or discovered through the Service</li>
              <li>Actions of Hosts, attendees, or third parties</li>
              <li>Unauthorized access to your account</li>
              <li>Errors, mistakes, or inaccuracies in Event information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">10. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless Laten and its affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or attendance at any Event.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">11. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">12. Governing Law and Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by the laws of Hungary, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Budapest, Hungary. For EU consumers, this does not affect your statutory rights under mandatory consumer protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">13. Severability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              For questions about these Terms, contact us:
            </p>
            <div className="glass-card p-4">
              <p className="text-sm"><strong>Email:</strong> <a href="mailto:legal@latenapp.com" className="text-primary hover:underline">legal@latenapp.com</a></p>
              <p className="text-sm mt-2"><strong>Support:</strong> <a href="mailto:latenconnect@latenapp.com" className="text-primary hover:underline">latenconnect@latenapp.com</a></p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">15. Related Policies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Please also review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which describes how we collect and use your personal information.
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default TermsOfService;
