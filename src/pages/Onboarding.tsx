import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Sparkles, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INTERESTS, HUNGARIAN_CITIES } from '@/types';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import latenLogo from '@/assets/laten-logo-onboarding.png';

const steps = ['welcome', 'age', 'interests', 'location', 'ready'] as const;
type Step = typeof steps[number];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { setHasCompletedOnboarding, setInterests, setSelectedCity } = useApp();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [age, setAge] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [city, setCity] = useState('Budapest');
  const [ageError, setAgeError] = useState('');

  const currentIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStep === 'age') {
      const ageNum = parseInt(age);
      if (!age || isNaN(ageNum)) {
        setAgeError('Please enter your age');
        return;
      }
      if (ageNum < 18) {
        setAgeError('You must be 18 or older to use Laten');
        return;
      }
      setAgeError('');
    }

    if (currentStep === 'ready') {
      setInterests(selectedInterests);
      setSelectedCity(city);
      setHasCompletedOnboarding(true);
      navigate('/explore');
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const pageVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px]" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <img 
                  src={latenLogo} 
                  alt="Laten" 
                  className="w-24 h-24 mx-auto object-contain mb-6"
                />
                <h1 className="text-4xl font-display font-bold mb-3">
                  Welcome to <span className="text-gradient">Laten</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-xs mx-auto">
                  Discover the best parties, clubs, and events near you
                </p>
              </motion.div>

              <div className="space-y-4 mb-8">
                {[
                  { icon: MapPin, text: 'Find events on a live map' },
                  { icon: Sparkles, text: 'Personalized recommendations' },
                  { icon: Shield, text: 'Verified hosts & safe events' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3 glass-card p-4 mx-auto max-w-xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 'age' && (
            <motion.div
              key="age"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="text-center"
            >
              <Shield className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl font-display font-bold mb-3">Age Verification</h2>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                You must be 18 or older to use Laten
              </p>

              <div className="max-w-xs mx-auto">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="w-full input-neon bg-card border border-border text-center text-2xl font-display font-bold py-4 mb-3"
                />
                {ageError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm"
                  >
                    {ageError}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 'interests' && (
            <motion.div
              key="interests"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className="text-center mb-8">
                <Sparkles className="w-16 h-16 mx-auto mb-6 text-primary" />
                <h2 className="text-3xl font-display font-bold mb-3">What's your vibe?</h2>
                <p className="text-muted-foreground">Select genres you're into</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center max-w-md mx-auto">
                {INTERESTS.map((interest) => (
                  <motion.button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'interest-chip',
                      selectedInterests.includes(interest) && 'selected'
                    )}
                  >
                    {selectedInterests.includes(interest) && (
                      <Check className="w-3 h-3 inline mr-1" />
                    )}
                    {interest}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 'location' && (
            <motion.div
              key="location"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className="text-center mb-8">
                <MapPin className="w-16 h-16 mx-auto mb-6 text-primary" />
                <h2 className="text-3xl font-display font-bold mb-3">Where are you?</h2>
                <p className="text-muted-foreground">Select your city</p>
              </div>

              <div className="max-h-72 overflow-y-auto no-scrollbar space-y-2 max-w-sm mx-auto">
                {HUNGARIAN_CITIES.map((c) => (
                  <motion.button
                    key={c.name}
                    onClick={() => setCity(c.name)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full glass-card p-4 text-left flex items-center justify-between transition-all',
                      city === c.name && 'border-primary bg-primary/10'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className={cn(
                        'w-5 h-5',
                        city === c.name ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <span className="font-medium">{c.name}</span>
                    </div>
                    {city === c.name && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 'ready' && (
            <motion.div
              key="ready"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-8"
              >
                <Check className="w-12 h-12 text-primary-foreground" />
              </motion.div>

              <h2 className="text-3xl font-display font-bold mb-3">You're all set!</h2>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                Let's find your next unforgettable night in {city}
              </p>

              <div className="glass-card p-4 max-w-xs mx-auto mb-8">
                <div className="flex flex-wrap gap-2 justify-center">
                  {selectedInterests.slice(0, 5).map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                  {selectedInterests.length > 5 && (
                    <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                      +{selectedInterests.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-8 pt-4 relative z-10">
        <Button
          onClick={handleNext}
          variant="neon"
          size="xl"
          className="w-full"
        >
          {currentStep === 'ready' ? 'Start Exploring' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
