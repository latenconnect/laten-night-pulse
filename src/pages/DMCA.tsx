import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DMCA: React.FC = () => {
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
            <Scale className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-xl">DMCA Policy</h1>
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
            <h2 className="text-xl font-display font-bold mb-4">Copyright Infringement Notification</h2>
            <p className="text-muted-foreground leading-relaxed">
              Laten respects the intellectual property rights of others and expects users to do the same. In accordance with the Digital Millennium Copyright Act ("DMCA"), we will respond promptly to claims of copyright infringement reported to our designated agent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">Filing a DMCA Notice</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If you believe content on Laten infringes your copyright, send a written notice to our DMCA agent including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>A physical or electronic signature of the copyright owner or authorized agent</li>
              <li>Identification of the copyrighted work claimed to have been infringed</li>
              <li>Identification of the infringing material and its location on Laten (URL or in-app reference)</li>
              <li>Your contact information (name, address, phone number, email)</li>
              <li>A statement that you have a good faith belief the use is not authorized by the copyright owner, agent, or law</li>
              <li>A statement, under penalty of perjury, that the information is accurate and that you are the copyright owner or authorized to act on behalf of the owner</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">Submit a Claim</h2>
            <p className="text-muted-foreground leading-relaxed">
              Send DMCA notices to: <a href="mailto:dmca@latenapp.com" className="text-primary hover:underline">dmca@latenapp.com</a>
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You can also submit DMCA claims directly through the app or via our automated form. We respond to valid claims within 48 hours.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">Counter-Notification</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If your content was removed and you believe it was a mistake or misidentification, you may submit a counter-notification including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Your physical or electronic signature</li>
              <li>Identification of the removed material and its prior location</li>
              <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
              <li>Your name, address, phone number, and consent to jurisdiction of your local courts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">Repeat Infringers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Laten will terminate accounts of users who are determined to be repeat infringers in appropriate circumstances.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">False Claims</h2>
            <p className="text-muted-foreground leading-relaxed">
              Filing a false DMCA notice may result in liability for damages, including costs and attorney's fees, under Section 512(f) of the DMCA.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              DMCA Agent: <a href="mailto:dmca@latenapp.com" className="text-primary hover:underline">dmca@latenapp.com</a><br />
              General support: <a href="mailto:support@latenapp.com" className="text-primary hover:underline">support@latenapp.com</a>
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default DMCA;
