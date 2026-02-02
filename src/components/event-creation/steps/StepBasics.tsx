import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Calendar, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EVENT_TYPES } from '@/types';
import { cn } from '@/lib/utils';
import { EventFormData } from '../EventCreationWizard';

interface StepBasicsProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

export const StepBasics: React.FC<StepBasicsProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Let's create something amazing</span>
        </motion.div>
        <h2 className="text-2xl font-bold">What's the event?</h2>
        <p className="text-muted-foreground">Start with the essentials</p>
      </div>

      {/* Cover Image - Upgraded */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full aspect-video rounded-2xl overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5" />
        <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-2xl group-hover:border-primary/60 transition-colors" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <Camera className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Add cover photo</p>
            <p className="text-xs text-muted-foreground">Makes your event stand out</p>
          </div>
        </div>
      </motion.button>

      {/* Event Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">
          Event Name <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Neon Nights @ The Basement"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="w-full ios-input text-lg font-medium"
        />
      </div>

      {/* Event Type - Improved Grid */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/80">
          What type of event? <span className="text-primary">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {EVENT_TYPES.map((type) => (
            <motion.button
              key={type.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateFormData({ type: type.id })}
              className={cn(
                'relative p-4 rounded-2xl border-2 transition-all text-left',
                formData.type === type.id 
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <p className="font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {type.id === 'club' && 'Club or bar event'}
                    {type.id === 'house_party' && 'Private gathering'}
                    {type.id === 'festival' && 'Multi-day event'}
                    {type.id === 'university' && 'Campus party'}
                    {type.id === 'outdoor' && 'Outdoor party'}
                    {type.id === 'foreigner' && 'International event'}
                  </p>
                </div>
              </div>
              {formData.type === type.id && (
                <motion.div
                  layoutId="type-check"
                  className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Date & Time - Side by Side with Better Styling */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">
            Date <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData({ date: e.target.value })}
              className="w-full ios-input pl-12"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">
            Start Time <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <input
              type="time"
              value={formData.time}
              onChange={(e) => updateFormData({ time: e.target.value })}
              className="w-full ios-input pl-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
