import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Users, Shield, Music, Calendar, ArrowRight, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cities = [
  'Budapest', 'Debrecen', 'Szeged', 'Pécs', 'Győr', 'Siófok',
  'Miskolc', 'Eger', 'Veszprém', 'Székesfehérvár', 'Sopron', 'Balatonfüred',
];

const features = [
  { icon: MapPin, title: 'Discover the night', desc: 'The best clubs, bars and parties — curated for Hungary.' },
  { icon: Users, title: 'Go out together', desc: 'See which friends are out tonight and join the vibe.' },
  { icon: Music, title: 'DJs & Bartenders', desc: 'Book the talent that makes your night unforgettable.' },
  { icon: Shield, title: 'Safe by design', desc: '18+ verified, end-to-end encrypted DMs, Safety Buddy check-ins.' },
  { icon: Calendar, title: 'Plan your week', desc: 'RSVPs, tickets and party groups in one place.' },
  { icon: Sparkles, title: 'Made for tonight', desc: 'Live feed, stories and the Tonight Mode that finds your party.' },
];

const LaunchHungary: React.FC = () => {
  React.useEffect(() => {
    document.title = 'Laten launches in Hungary — The nightlife app for Budapest & beyond';
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = 'Laten is launching across Hungary. Discover clubs, parties and DJs in Budapest, Debrecen, Szeged and more. Join the launch.';
    if (metaDesc) metaDesc.setAttribute('content', content);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/30 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/30 blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md mb-8"
          >
            <span className="text-2xl">🇭🇺</span>
            <span className="text-sm font-medium tracking-wide">Now launching across Hungary</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent"
          >
            The Hungarian night,<br />reimagined.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Laten is the app for everyone who lives for the night. From Budapest's underground to Siófok's beach clubs — discover, plan and connect.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="group h-14 px-8 text-base rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all">
              <Link to="/auth">
                Join the launch
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-border/50 backdrop-blur-md">
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer">
                <Apple className="mr-2 w-5 h-5" />
                Download on iOS
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Cities */}
      <section className="px-6 py-16 md:py-24 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">Available now in</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">16 Hungarian cities. One nightlife.</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {cities.map((city, i) => (
              <motion.div
                key={city}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="px-5 py-2.5 rounded-full bg-card/50 border border-border/40 backdrop-blur-md text-sm font-medium hover:border-primary/50 transition-colors"
              >
                {city}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need for the night.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Built for the Hungarian scene — from kollégium house parties to sunrise sets at Sziget.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-md hover:border-primary/40 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 md:py-32 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Tonight starts here.</h2>
          <p className="text-lg text-muted-foreground mb-10">Be among the first to shape Hungary's nightlife platform.</p>
          <Button asChild size="lg" className="h-14 px-10 text-base rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Link to="/auth">
              Get started — it's free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-6">18+ only · Verified with Didit · Made in Hungary</p>
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-border/30 text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/eula" className="hover:text-foreground transition-colors">EULA</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
        </div>
        <p className="mt-4">© 2026 Laten · Budapest, Hungary</p>
      </footer>
    </main>
  );
};

export default LaunchHungary;
