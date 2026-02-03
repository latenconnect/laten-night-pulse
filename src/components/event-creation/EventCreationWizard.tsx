import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHost, useCreateEvent } from '@/hooks/useHost';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useHostSubscription } from '@/hooks/useHostSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { StepBasics } from './steps/StepBasics';
import { StepLocation } from './steps/StepLocation';
import { StepDetails } from './steps/StepDetails';
import { StepReview } from './steps/StepReview';
import { WizardProgress } from './WizardProgress';

export interface EventFormData {
  name: string;
  type: string;
  date: string;
  time: string;
  end_time: string;
  location_name: string;
  location_address: string;
  show_address: boolean;
  city: string;
  price: string;
  age_limit: string;
  description: string;
  expected_attendance: string;
  max_attendees: string;
  dress_code: string;
  music_genres: string[];
  safety_rules: string;
  contact_info: string;
  show_contact: boolean;
  cover_image?: string;
}

const STEPS = [
  { id: 'basics', label: 'Basics', icon: '✨' },
  { id: 'location', label: 'Location', icon: '📍' },
  { id: 'details', label: 'Details', icon: '🎵' },
  { id: 'review', label: 'Review', icon: '🚀' },
];

export const EventCreationWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCity } = useApp();
  const { t } = useLanguage();
  const { host, isVerifiedHost } = useHost();
  const { createEvent, canCreateEvent } = useCreateEvent();
  const { isSubscribed: hasPartyBoost } = useHostSubscription(host?.id);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(0);

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    type: 'club',
    date: '',
    time: '',
    end_time: '',
    location_name: '',
    location_address: '',
    show_address: false,
    city: selectedCity,
    price: '',
    age_limit: '18',
    description: '',
    expected_attendance: '',
    max_attendees: '',
    dress_code: 'none',
    music_genres: [],
    safety_rules: '',
    contact_info: '',
    show_contact: false,
  });

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basics
        return formData.name.trim() && formData.type && formData.date && formData.time;
      case 1: // Location
        return formData.location_name.trim() && formData.city;
      case 2: // Details
        return true; // All optional
      case 3: // Review
        return canCreateEvent;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    
    setSubmitting(true);

    const startTime = new Date(`${formData.date}T${formData.time}`).toISOString();
    const endTime = formData.end_time 
      ? new Date(`${formData.date}T${formData.end_time}`).toISOString() 
      : undefined;

    const event = await createEvent({
      name: formData.name,
      type: formData.type,
      location_name: formData.location_name,
      location_address: formData.show_address ? formData.location_address : undefined,
      city: formData.city,
      start_time: startTime,
      end_time: endTime,
      price: formData.price ? parseFloat(formData.price) : 0,
      age_limit: parseInt(formData.age_limit),
      description: formData.description || undefined,
      expected_attendance: formData.expected_attendance ? parseInt(formData.expected_attendance) : undefined,
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
      safety_rules: formData.safety_rules || undefined,
    });

    setSubmitting(false);

    if (event) {
      if (hasPartyBoost && host) {
        try {
          await supabase.functions.invoke('send-boost-notification', {
            body: {
              eventId: event.id,
              eventName: formData.name,
              eventCity: formData.city,
              hostName: user?.email?.split('@')[0] || 'Host',
              startTime: startTime,
            },
          });
          toast.success('🚀 Boost notification sent to nearby users!');
        } catch (err) {
          console.error('Failed to send boost notification:', err);
        }
      }
      
      navigate(`/event/${event.id}`);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - iOS optimized with larger touch targets */}
      <header className="sticky top-0 z-50 ios-blur-material border-b border-border/30 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => currentStep === 0 ? navigate(-1) : prevStep()}
            className="w-11 h-11 -ml-2 rounded-full hover:bg-muted/50 active:bg-muted/70 transition-colors flex items-center justify-center touch-manipulation"
            aria-label={currentStep === 0 ? "Close" : "Go back"}
          >
            {currentStep === 0 ? (
              <X className="w-6 h-6" />
            ) : (
              <ArrowLeft className="w-6 h-6" />
            )}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-lg">{STEPS[currentStep].icon}</span>
            <h1 className="font-semibold">{STEPS[currentStep].label}</h1>
          </div>

          <div className="w-11" /> {/* Spacer for centering - matches button width */}
        </div>
        
        <WizardProgress steps={STEPS} currentStep={currentStep} />
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 380, damping: 35 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 overflow-y-auto"
          >
            <div className="px-5 py-6 pb-32">
              {currentStep === 0 && (
                <StepBasics formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 1 && (
                <StepLocation formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 2 && (
                <StepDetails formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 3 && (
                <StepReview 
                  formData={formData} 
                  isVerifiedHost={isVerifiedHost}
                  canCreateEvent={canCreateEvent}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 ios-blur-material border-t border-border/30 p-4 pb-8">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          
          {currentStep < STEPS.length - 1 ? (
            <Button
              variant="neon"
              size="lg"
              className="flex-1 gap-2"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="neon"
              size="lg"
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Event
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
