import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Ticket, Users, Clock, Shirt, Shield, Phone, 
  ChevronDown, Info, Eye, EyeOff 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { INTERESTS } from '@/types';
import { cn } from '@/lib/utils';
import { EventFormData } from '../EventCreationWizard';

interface StepDetailsProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

const DRESS_CODE_OPTIONS = [
  { id: 'casual', label: 'Casual', icon: '👕' },
  { id: 'smart_casual', label: 'Smart Casual', icon: '👔' },
  { id: 'formal', label: 'Formal', icon: '🎩' },
  { id: 'themed', label: 'Themed', icon: '🎭' },
  { id: 'none', label: 'No Dress Code', icon: '✨' },
];

interface CollapsibleSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon, title, subtitle, children, defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div 
      className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden"
      initial={false}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const StepDetails: React.FC<StepDetailsProps> = ({ formData, updateFormData }) => {
  const toggleGenre = (genre: string) => {
    const newGenres = formData.music_genres.includes(genre)
      ? formData.music_genres.filter(g => g !== genre)
      : formData.music_genres.length < 5 
        ? [...formData.music_genres, genre] 
        : formData.music_genres;
    updateFormData({ music_genres: newGenres });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-2">
          <Music className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Add the vibes</h2>
        <p className="text-muted-foreground">All optional, but helps guests know what to expect</p>
      </div>

      {/* Description - Always Visible */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Description
        </label>
        <textarea
          placeholder="Tell people what makes this party special..."
          rows={3}
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          className="w-full ios-input resize-none"
        />
      </div>

      {/* Music Genres - Always Visible */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <Music className="w-4 h-4" />
          Music Genres
          <span className="text-xs text-muted-foreground ml-auto">
            {formData.music_genres.length}/5 selected
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.slice(0, 12).map(genre => (
            <Badge
              key={genre}
              variant={formData.music_genres.includes(genre) ? "default" : "outline"}
              className={cn(
                'cursor-pointer transition-all py-1.5 px-3',
                formData.music_genres.includes(genre)
                  ? 'bg-primary hover:bg-primary/90'
                  : 'hover:border-primary/50 hover:bg-primary/10'
              )}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Ticket & Capacity */}
        <CollapsibleSection
          icon={<Ticket className="w-5 h-5 text-primary" />}
          title="Entry & Capacity"
          subtitle="Price and guest limits"
        >
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Entry Price (Ft)</label>
                <input
                  type="number"
                  placeholder="0 = Free"
                  value={formData.price}
                  onChange={(e) => updateFormData({ price: e.target.value })}
                  className="w-full ios-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Age Limit</label>
                <select
                  value={formData.age_limit}
                  onChange={(e) => updateFormData({ age_limit: e.target.value })}
                  className="w-full ios-input"
                >
                  <option value="18">18+</option>
                  <option value="21">21+</option>
                  <option value="25">25+</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Expected Guests</label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={formData.expected_attendance}
                  onChange={(e) => updateFormData({ expected_attendance: e.target.value })}
                  className="w-full ios-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Max Capacity</label>
                <input
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.max_attendees}
                  onChange={(e) => updateFormData({ max_attendees: e.target.value })}
                  className="w-full ios-input"
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* End Time */}
        <CollapsibleSection
          icon={<Clock className="w-5 h-5 text-primary" />}
          title="End Time"
          subtitle="When does it wrap up?"
        >
          <div className="pt-4">
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => updateFormData({ end_time: e.target.value })}
              className="w-full ios-input"
            />
          </div>
        </CollapsibleSection>

        {/* Dress Code */}
        <CollapsibleSection
          icon={<Shirt className="w-5 h-5 text-primary" />}
          title="Dress Code"
          subtitle={DRESS_CODE_OPTIONS.find(d => d.id === formData.dress_code)?.label || 'None'}
        >
          <div className="pt-4 grid grid-cols-3 gap-2">
            {DRESS_CODE_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => updateFormData({ dress_code: option.id })}
                className={cn(
                  'p-3 rounded-xl border text-center transition-all',
                  formData.dress_code === option.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 hover:border-primary/30'
                )}
              >
                <span className="text-xl">{option.icon}</span>
                <p className="text-xs mt-1">{option.label}</p>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* House Rules */}
        <CollapsibleSection
          icon={<Shield className="w-5 h-5 text-primary" />}
          title="House Rules"
          subtitle="Set expectations for guests"
        >
          <div className="pt-4">
            <textarea
              placeholder="e.g., No smoking inside, BYOB allowed, Respect neighbors..."
              rows={3}
              value={formData.safety_rules}
              onChange={(e) => updateFormData({ safety_rules: e.target.value })}
              className="w-full ios-input resize-none"
            />
          </div>
        </CollapsibleSection>

        {/* Contact Info */}
        <CollapsibleSection
          icon={<Phone className="w-5 h-5 text-primary" />}
          title="Contact Info"
          subtitle={formData.show_contact ? 'Public' : 'RSVP only'}
        >
          <div className="pt-4 space-y-3">
            <input
              type="text"
              placeholder="e.g., WhatsApp: +36 XX XXX XXXX"
              value={formData.contact_info}
              onChange={(e) => updateFormData({ contact_info: e.target.value })}
              className="w-full ios-input"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.show_contact ? (
                  <Eye className="w-4 h-4 text-primary" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  {formData.show_contact ? 'Visible to everyone' : 'Only after RSVP'}
                </span>
              </div>
              <Switch
                checked={formData.show_contact}
                onCheckedChange={(checked) => updateFormData({ show_contact: checked })}
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};
