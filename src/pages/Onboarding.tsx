import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Sparkles, Shield, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INTERESTS, HUNGARIAN_CITIES } from '@/types';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAgeVerification } from '@/hooks/useAgeVerification';
import { cn } from '@/lib/utils';
import latenLogo from '@/assets/laten-logo-onboarding.png';
import { toast } from 'sonner';

const steps = ['welcome', 'age', 'interests', 'location', 'ready'] as const;
type Step = typeof steps[number];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { hasCompletedOnboarding, setHasCompletedOnboarding, setInterests, setSelectedCity } = useApp();
  const { loading: verificationLoading, error: verificationError, startVerification, checkVerificationStatus } = useAgeVerification();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  // Redirect if already completed onboarding
  useEffect(() => {
    if (hasCompletedOnboarding) {
      navigate('/explore', { replace: true });
    }
  }, [hasCompletedOnboarding, navigate]);
  
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [age, setAge] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [city, setCity] = useState('Budapest');
  const [ageError, setAgeError] = useState('');
  const [verificationMode, setVerificationMode] = useState<'manual' | 'didit'>('manual');
  const [isVerified, setIsVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Rate limiting for age entry attempts
  const [ageAttempts, setAgeAttempts] = useState(0);
  const [ageLocked, setAgeLocked] = useState(false);
  const MAX_AGE_ATTEMPTS = 3;

  const currentIndex = steps.indexOf(currentStep);

  // Check verification status when user is logged in
  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        setCheckingStatus(true);
        const verified = await checkVerificationStatus();
        setIsVerified(verified);
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [user, checkVerificationStatus]);

  const handleDiditVerification = async () => {
    if (!user) {
      toast.error('Please sign in to verify your age with Didit');
      navigate('/auth');
      return;
    }

    const session = await startVerification();
    if (session?.url) {
      // Open Didit verification in a new tab
      window.open(session.url, '_blank');
      toast.info('Complete verification in the new tab, then return here');
      
      // Poll for verification status
      const pollInterval = setInterval(async () => {
        const verified = await checkVerificationStatus();
        if (verified) {
          setIsVerified(true);
          clearInterval(pollInterval);
          toast.success('Age verified successfully!');
          // Auto-advance to next step
          setCurrentStep('interests');
        }
      }, 3000);

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
    }
  };

  const handleNext = () => {
    if (currentStep === 'age') {
      if (ageLocked) {
        setAgeError('Too many attempts. Please use ID Verification instead.');
        setVerificationMode('didit');
        return;
      }
      
      if (verificationMode === 'manual') {
        const ageNum = parseInt(age);
        if (!age || isNaN(ageNum)) {
          setAgeError('Please enter your age');
          return;
        }
        if (ageNum < 18) {
          const newAttempts = ageAttempts + 1;
          setAgeAttempts(newAttempts);
          
          if (newAttempts >= MAX_AGE_ATTEMPTS) {
            setAgeLocked(true);
            setAgeError('Too many invalid attempts. Please verify your age with ID.');
            setVerificationMode('didit');
            toast.error('Age entry locked. Please use ID verification.');
          } else {
            setAgeError(`You must be 18 or older to use Laten (${MAX_AGE_ATTEMPTS - newAttempts} attempts remaining)`);
          }
          return;
        }
        setAgeError('');
      } else if (!isVerified) {
        toast.error('Please complete age verification first');
        return;
      }
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

  // Limit interest selection to prevent spam toggling
  const MAX_INTERESTS = 10;
  
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      // Limit max selections
      if (prev.length >= MAX_INTERESTS) {
        toast.error(`Maximum ${MAX_INTERESTS} interests allowed`);
        return prev;
      }
      return [...prev, interest];
    });
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
                  className="w-32 h-32 mx-auto object-contain mb-6 drop-shadow-[0_0_25px_hsla(270,91%,65%,0.6)]"
                />
                <h1 className="text-4xl font-display font-bold mb-3">
                  {t('onboarding.welcome')}
                </h1>
                <p className="text-muted-foreground text-lg max-w-xs mx-auto">
                  {t('onboarding.subtitle')}
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
              <h2 className="text-3xl font-display font-bold mb-3">{t('onboarding.ageVerification')}</h2>
              <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                {t('onboarding.mustBe18')}
              </p>

              {/* Verification Mode Toggle */}
              <div className="flex gap-2 justify-center mb-6">
                <button
                  onClick={() => setVerificationMode('manual')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    verificationMode === 'manual'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  Quick Entry
                </button>
                <button
                  onClick={() => setVerificationMode('didit')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    verificationMode === 'didit'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  ID Verification
                </button>
              </div>

              {verificationMode === 'manual' ? (
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
                  <p className="text-muted-foreground text-xs mt-4">
                    For full features, consider using ID Verification
                  </p>
                </div>
              ) : (
                <div className="max-w-xs mx-auto">
                  {checkingStatus ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Checking verification status...</p>
                    </div>
                  ) : isVerified ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="glass-card p-6 border-green-500/50"
                    >
                      <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="font-semibold text-green-400 mb-2">Age Verified!</h3>
                      <p className="text-muted-foreground text-sm">
                        Your identity has been verified. You can continue.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="glass-card p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Verify your age securely with Didit. This provides a verified badge on your profile.
                        </p>
                        <Button
                          onClick={handleDiditVerification}
                          disabled={verificationLoading || !user}
                          variant="neon"
                          className="w-full"
                        >
                          {verificationLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Starting verification...
                            </>
                          ) : (
                            <>
                              Verify with Didit
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {!user && (
                        <p className="text-amber-400 text-sm">
                          Please sign in first to use ID verification
                        </p>
                      )}

                      {verificationError && (
                        <p className="text-destructive text-sm">{verificationError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
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
                <h2 className="text-3xl font-display font-bold mb-3">{t('onboarding.selectInterests')}</h2>
                <p className="text-muted-foreground">{t('common.filter')}</p>
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
                <h2 className="text-3xl font-display font-bold mb-3">{t('onboarding.selectCity')}</h2>
                <p className="text-muted-foreground">{t('explore.venuesIn')} {city}</p>
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

              <h2 className="text-3xl font-display font-bold mb-3">{t('onboarding.finish')}</h2>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                {t('home.discoverMore')} {city}
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
          disabled={currentStep === 'age' && verificationMode === 'didit' && !isVerified && !checkingStatus}
        >
          {currentStep === 'ready' ? t('onboarding.finish') : t('onboarding.next')}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
