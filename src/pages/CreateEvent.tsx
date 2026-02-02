import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAgeVerification } from '@/hooks/useAgeVerification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EventCreationWizard } from '@/components/event-creation';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { startVerification, loading: verificationLoading } = useAgeVerification();
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [checkingAge, setCheckingAge] = useState(true);

  React.useEffect(() => {
    const checkAgeVerification = async () => {
      if (!user) {
        setCheckingAge(false);
        return;
      }
      
      // Check if user is a dev (bypasses age verification)
      const { data: isDevData } = await supabase.rpc('is_dev_user', { _user_id: user.id });
      if (isDevData === true) {
        setIsAgeVerified(true);
        setCheckingAge(false);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('age_verified')
        .eq('id', user.id)
        .maybeSingle();
      setIsAgeVerified(data?.age_verified === true);
      setCheckingAge(false);
    };
    checkAgeVerification();
  }, [user]);

  const handleVerifyAge = async () => {
    const result = await startVerification();
    if (result?.url) {
      window.open(result.url, '_blank');
      toast.info(t('events.completeVerification'));
    }
  };

  // Loading state
  if (checkingAge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 ios-blur-material border-b border-border/30 px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-lg">{t('host.createEvent')}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-bold text-xl mb-2 text-center">{t('host.signInRequired')}</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-xs">
            {t('host.signInRequiredDesc')}
          </p>
          <Button variant="neon" size="lg" onClick={() => navigate('/auth')}>
            {t('auth.signIn')}
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Age verification required
  if (!isAgeVerified) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 ios-blur-material border-b border-border/30 px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-lg">{t('host.createEvent')}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-bold text-xl mb-2 text-center">{t('events.ageVerificationRequired')}</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-xs">
            {t('host.ageVerificationCreateDesc')}
          </p>
          <Button variant="neon" size="lg" onClick={handleVerifyAge} disabled={verificationLoading}>
            {verificationLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
            {t('host.verifyMyAge')}
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Main wizard
  return <EventCreationWizard />;
};

export default CreateEvent;
