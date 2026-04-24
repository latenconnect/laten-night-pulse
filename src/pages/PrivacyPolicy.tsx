import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy: React.FC = () => {
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
          <p className="text-muted-foreground text-sm mb-6">Last Updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Laten collects the following information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Email, display name, date of birth, profile photo</li>
              <li><strong>Location Data:</strong> Approximate location for event discovery and check-ins</li>
              <li><strong>Usage Data:</strong> Events attended, venues visited, check-ins, friend connections</li>
              <li><strong>Messages:</strong> Direct messages (end-to-end encrypted)</li>
              <li><strong>Device Information:</strong> Device type, OS version, push notification tokens</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and improve Laten services</li>
              <li>Recommend relevant events and venues</li>
              <li>Enable social features (friends, check-ins, activity feed)</li>
              <li>Send notifications about events and friend activity</li>
              <li>Detect and prevent fraud, spam, and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">3. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We do NOT sell your personal information. We share data only with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Other Users:</strong> Profile info, check-ins, and events are visible to friends</li>
              <li><strong>Service Providers:</strong> Supabase (hosting), Google Maps (venue data), Firebase (analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to prevent harm</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">4. Automated Content Moderation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Laten uses automated tools (AI moderation) to scan event descriptions, photos, and user-reported content for safety violations. Flagged content may be reviewed by our moderation team.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data while your account is active. Deleted accounts are permanently removed within 30 days. Backups may retain data for up to 90 days as required by our infrastructure provider.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">6. Your Rights (GDPR/CCPA)</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Delete:</strong> Delete your account and data via Settings</li>
              <li><strong>Correct:</strong> Update your profile information</li>
              <li><strong>Opt-Out:</strong> Disable analytics and marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">7. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users under 18 are marked as minors and have restricted access to certain features. We do not knowingly collect data from children under 13. If you believe a child under 13 is using Laten, contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">8. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard security measures including end-to-end encryption for messages, secure data storage, and regular security audits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy. We'll notify you of material changes via email or in-app notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy questions or to exercise your rights, email: <a href="mailto:privacy@latenapp.com" className="text-primary hover:underline">privacy@latenapp.com</a>
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
