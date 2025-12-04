import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Camera, MapPin, Calendar, Clock, Ticket, Users, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EVENT_TYPES } from '@/types';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">Create Event</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Host Verification Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, hsl(270 91% 65% / 0.15) 0%, hsl(180 100% 50% / 0.1) 100%)',
          }}
        >
          <div className="absolute inset-0 border border-primary/20 rounded-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Host Verification Required</p>
              <p className="text-xs text-muted-foreground">Complete verification to create public events</p>
            </div>
            <Button variant="outline" size="sm">
              Verify
            </Button>
          </div>
        </motion.div>

        {/* Cover Image */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Cover Image</label>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="h-48 rounded-2xl border-2 border-dashed border-border bg-card/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Camera className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Upload cover photo</p>
            <p className="text-xs text-muted-foreground mt-1">Recommended: 1920x1080px</p>
          </motion.div>
        </div>

        {/* Event Name */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Event Name</label>
          <input
            type="text"
            placeholder="Enter event name..."
            className="w-full input-neon bg-card border border-border"
          />
        </div>

        {/* Event Type */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Event Type</label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.id}
                className={cn(
                  'glass-card p-3 text-center transition-all hover:border-primary/50',
                  'flex flex-col items-center gap-1'
                )}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-xs">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                className="w-full input-neon bg-card border border-border pl-12"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Time</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="time"
                className="w-full input-neon bg-card border border-border pl-12"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Location</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search location or enter address..."
              className="w-full input-neon bg-card border border-border pl-12"
            />
          </div>
        </div>

        {/* Price & Age */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Entry Price</label>
            <div className="relative">
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                placeholder="0 = Free"
                className="w-full input-neon bg-card border border-border pl-12"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Age Limit</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select className="w-full input-neon bg-card border border-border pl-12 appearance-none">
                <option>18+</option>
                <option>21+</option>
                <option>25+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Description</label>
          <div className="relative">
            <Info className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <textarea
              placeholder="Tell people about your event..."
              rows={4}
              className="w-full input-neon bg-card border border-border pl-12 resize-none"
            />
          </div>
        </div>

        {/* Max Capacity */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Expected Attendance (Optional)</label>
          <input
            type="number"
            placeholder="e.g., 200"
            className="w-full input-neon bg-card border border-border"
          />
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40">
        <Button variant="neon" size="xl" className="w-full gap-2">
          <Plus className="w-5 h-5" />
          Create Event
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default CreateEvent;
