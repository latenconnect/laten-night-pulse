import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Eye, EyeOff, Navigation, Building2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { HUNGARIAN_CITIES } from '@/types';
import { cn } from '@/lib/utils';
import { EventFormData } from '../EventCreationWizard';

interface StepLocationProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

export const StepLocation: React.FC<StepLocationProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/20 mb-2">
          <MapPin className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold">Where's it happening?</h2>
        <p className="text-muted-foreground">Set the venue and city</p>
      </div>

      {/* Venue Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">
          Venue Name <span className="text-primary">*</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="e.g., Szimpla Kert, My Apartment"
            value={formData.location_name}
            onChange={(e) => updateFormData({ location_name: e.target.value })}
            className="w-full ios-input pl-12"
          />
        </div>
      </div>

      {/* City Selection - Card Style */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/80">
          City <span className="text-primary">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {HUNGARIAN_CITIES.slice(0, 8).map((city) => (
            <motion.button
              key={city.name}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => updateFormData({ city: city.name })}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                formData.city === city.name
                  ? 'border-secondary bg-secondary/10'
                  : 'border-border/50 bg-card/50 hover:border-secondary/30'
              )}
            >
              <span className="font-medium">{city.name}</span>
            </motion.button>
          ))}
        </div>
        {HUNGARIAN_CITIES.length > 8 && (
          <select
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            className="w-full ios-input"
          >
            {HUNGARIAN_CITIES.map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Address Section */}
      <motion.div 
        className="space-y-4 p-4 rounded-2xl bg-card/50 border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Navigation className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Street Address</p>
              <p className="text-xs text-muted-foreground">Optional but helps guests find you</p>
            </div>
          </div>
        </div>
        
        <input
          type="text"
          placeholder="e.g., Kazinczy utca 14"
          value={formData.location_address}
          onChange={(e) => updateFormData({ location_address: e.target.value })}
          className="w-full ios-input"
        />

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            {formData.show_address ? (
              <Eye className="w-4 h-4 text-secondary" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {formData.show_address ? 'Visible to everyone' : 'Only after RSVP'}
            </span>
          </div>
          <Switch
            checked={formData.show_address}
            onCheckedChange={(checked) => updateFormData({ show_address: checked })}
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          {formData.show_address 
            ? '📍 Address shown publicly on event page'
            : '🔒 Address revealed only to confirmed guests'
          }
        </p>
      </motion.div>
    </div>
  );
};
