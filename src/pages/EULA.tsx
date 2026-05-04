import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EULA: React.FC = () => {
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
            <h1 className="font-display font-bold text-xl">End User License Agreement</h1>
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
              By downloading, installing, or using the Laten application ("App"), you agree to be bound by this End User License Agreement ("EULA"). If you do not agree, do not use the App.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">2. License Grant</h2>
            <p className="text-muted-foreground leading-relaxed">
              Laten grants you a limited, non-exclusive, non-transferable, revocable license to use the App for your personal, non-commercial use, strictly in accordance with this EULA and the Apple Media Services Terms (or applicable platform terms).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">3. Restrictions</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Reverse engineer, decompile, or disassemble the App</li>
              <li>Modify, adapt, or create derivative works based on the App</li>
              <li>Rent, lease, sell, sublicense, or transfer the App</li>
              <li>Use the App for any illegal or unauthorized purpose</li>
              <li>Interfere with or disrupt the App or servers</li>
              <li>Use automated systems (bots, scrapers) to access the App</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">4. Zero Tolerance for Objectionable Content</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Laten enforces a strict zero-tolerance policy for objectionable content and abusive behavior. Prohibited content includes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Hate speech, harassment, or threats</li>
              <li>Sexually explicit or pornographic material</li>
              <li>Violence, self-harm, or illegal activity promotion</li>
              <li>Content involving minors in inappropriate contexts</li>
              <li>Spam, scams, or misleading information</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Violators will be permanently banned. Report objectionable content via the in-app report feature or email <a href="mailto:support@latenapp.com" className="text-primary hover:underline">support@latenapp.com</a>. We respond within 24 hours.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">5. User-Generated Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of content you post. By posting, you grant Laten a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content within the App. You are solely responsible for your content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">6. Subscriptions and In-App Purchases</h2>
            <p className="text-muted-foreground leading-relaxed">
              Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your App Store account settings. Refunds are handled by Apple per their policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              This license is effective until terminated. Laten may terminate your access at any time for violation of this EULA. Upon termination, you must cease all use of the App.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. LATEN DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              LATEN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE APP.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              This EULA is governed by the laws of Hungary. Any disputes shall be resolved in Hungarian courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about this EULA? Email <a href="mailto:support@latenapp.com" className="text-primary hover:underline">support@latenapp.com</a>
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default EULA;
