import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();
  const lastUpdated = "April 25, 2026";

  return (
    <div className="min-h-screen bg-background">
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
          <p className="text-muted-foreground text-sm mb-6">Last Updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using Laten, you agree to these Terms of Service. If you don't agree, don't use the app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">2. Eligibility</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You must be at least 13 years old to use Laten</li>
              <li>Users 13-17 are marked as minors and have restricted features</li>
              <li>You must provide accurate age information (lying about your age may result in account termination)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">3. Account Responsibilities</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You are responsible for your account security</li>
              <li>You must not share your login credentials</li>
              <li>You must notify us immediately if your account is compromised</li>
              <li>One person, one account (no fake accounts)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">4. User Content & Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree NOT to post or share:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Illegal content or activity</li>
              <li>Hate speech, harassment, or bullying</li>
              <li>Nudity or sexually explicit content</li>
              <li>Spam or misleading information</li>
              <li>Copyrighted material you don't own</li>
              <li>Personal information of others without consent</li>
            </ul>
            <div className="glass-card p-4 mt-4 border-l-4 border-yellow-500">
              <p className="text-sm text-muted-foreground">
                <strong className="text-yellow-500">Violations may result in:</strong> Content removal, account suspension, or permanent ban.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">5. Events & Venues</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Laten is a discovery platform — we do NOT organize or control events</li>
              <li>Event organizers are responsible for their events</li>
              <li>Venue information is provided by third parties (Google Maps) and may be inaccurate</li>
              <li>You attend events at your own risk</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">6. Safety Disclaimer</h2>
            <div className="glass-card p-4 border-l-4 border-yellow-500">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong className="text-yellow-500">IMPORTANT:</strong> Laten is not responsible for your safety at third-party events. Always:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                    <li>Meet in public places</li>
                    <li>Tell someone where you're going</li>
                    <li>Trust your instincts</li>
                    <li>Use the SOS feature if you feel unsafe</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">7. Intellectual Property</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You own the content you post</li>
              <li>By posting, you grant Laten a license to display your content</li>
              <li>Laten owns the app, logo, and branding</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">8. Subscriptions & Payments</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Premium subscriptions are billed through the App Store</li>
              <li>Subscriptions auto-renew unless canceled</li>
              <li>Refunds are handled by Apple (see App Store policies)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your account if you violate these terms. You can delete your account anytime in Settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY LAW, LATEN IS NOT LIABLE FOR ANY DAMAGES ARISING FROM YOUR USE OF THE APP, INCLUDING BUT NOT LIMITED TO: PERSONAL INJURY, PROPERTY DAMAGE, LOST DATA, OR BUSINESS INTERRUPTION.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">11. Dispute Resolution</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Governed by the laws of Hungary</li>
              <li>Disputes resolved in Hungarian courts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms. Continued use of the app means you accept the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions? Email <a href="mailto:support@latenapp.com" className="text-primary hover:underline">support@latenapp.com</a>
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default TermsOfService;
