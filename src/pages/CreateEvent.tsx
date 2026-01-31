import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Camera, MapPin, Calendar, Clock, Ticket, Users, Info, Sparkles, Lock, Check, Music, Shield, Shirt, Phone, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { EVENT_TYPES, HUNGARIAN_CITIES, INTERESTS } from '@/types';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';
import { useHost, useCreateEvent } from '@/hooks/useHost';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { CohostManager } from '@/components/CohostManager';
import { toast } from 'sonner';
import { useAgeVerification } from '@/hooks/useAgeVerification';
import { useHostSubscription } from '@/hooks/useHostSubscription';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, Loader2 } from 'lucide-react';

const DRESS_CODE_OPTIONS = [
  { id: 'casual', label: 'Casual', icon: '👕' },
  { id: 'smart_casual', label: 'Smart Casual', icon: '👔' },
  { id: 'formal', label: 'Formal', icon: '🎩' },
  { id: 'themed', label: 'Themed', icon: '🎭' },
  { id: 'none', label: 'No Dress Code', icon: '✨' },
];

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCity } = useApp();
  const { t } = useLanguage();
  const { host, applyAsHost, isVerifiedHost, isPendingHost, loading: hostLoading } = useHost();
  const { isSubscribed: hasPartyBoost } = useHostSubscription(host?.id);
  const { createEvent, canCreateEvent } = useCreateEvent();
  const { startVerification, loading: verificationLoading } = useAgeVerification();
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [checkingAge, setCheckingAge] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState({
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
    music_genres: [] as string[],
    safety_rules: '',
    contact_info: '',
    show_contact: false,
  });
  const [pendingCohostIds, setPendingCohostIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      music_genres: prev.music_genres.includes(genre)
        ? prev.music_genres.filter(g => g !== genre)
        : prev.music_genres.length < 5 ? [...prev.music_genres, genre] : prev.music_genres
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.time || !formData.location_name) {
      toast.error(t('host.fillRequiredFields'));
      return;
    }

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
      // Send boost notification if host has Party Boost subscription
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-4">
          <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-xl">{t('host.createEvent')}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <Lock className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">{t('host.signInRequired')}</h2>
          <p className="text-muted-foreground text-center mb-6">
            {t('host.signInRequiredDesc')}
          </p>
          <Button variant="neon" onClick={() => navigate('/auth')}>
            {t('auth.signIn')}
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Age verification required
  if (!checkingAge && !isAgeVerified) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-4">
          <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-xl">{t('host.createEvent')}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <ShieldAlert className="w-16 h-16 text-primary mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">{t('events.ageVerificationRequired')}</h2>
          <p className="text-muted-foreground text-center mb-6">
            {t('host.ageVerificationCreateDesc')}
          </p>
          <Button variant="neon" onClick={handleVerifyAge} disabled={verificationLoading}>
            {verificationLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {t('host.verifyMyAge')}
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">{t('host.createEvent')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Host Verification Banner */}
        {!isVerifiedHost && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: isPendingHost
                ? 'linear-gradient(135deg, hsl(45 100% 50% / 0.15) 0%, hsl(30 100% 50% / 0.1) 100%)'
                : 'linear-gradient(135deg, hsl(270 91% 65% / 0.15) 0%, hsl(180 100% 50% / 0.1) 100%)',
            }}
          >
            <div className={cn(
              "absolute inset-0 border rounded-2xl",
              isPendingHost ? "border-yellow-500/20" : "border-primary/20"
            )} />
            <div className="relative flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isPendingHost ? "bg-yellow-500/20" : "bg-primary/20"
              )}>
                <Sparkles className={cn("w-6 h-6", isPendingHost ? "text-yellow-500" : "text-primary")} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {isPendingHost ? t('host.verificationPending') : t('host.hostVerificationRequired')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPendingHost 
                    ? t('host.applicationBeingReviewed')
                    : t('host.applyToBecomeHost')
                  }
                </p>
              </div>
              {!isPendingHost && !host && (
                <Button variant="outline" size="sm" onClick={applyAsHost}>
                  {t('host.apply')}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {isVerifiedHost && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 w-fit"
          >
            <Check className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">{t('host.verifiedHost')}</span>
          </motion.div>
        )}

        {/* Cover Image */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">{t('host.coverImage')}</label>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "h-48 rounded-2xl border-2 border-dashed bg-card/50 flex flex-col items-center justify-center cursor-pointer transition-colors",
              canCreateEvent ? "border-border hover:border-primary/50" : "border-border/50 opacity-50 cursor-not-allowed"
            )}
          >
            <Camera className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('host.uploadCoverPhoto')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('host.recommendedSize')}</p>
          </motion.div>
        </div>

        {/* Event Name */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">{t('host.eventNameRequired')}</label>
          <input
            type="text"
            placeholder={t('host.enterEventName')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={!canCreateEvent}
            className="w-full input-neon bg-card border border-border disabled:opacity-50"
          />
        </div>

        {/* Event Type */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">{t('host.eventType')}</label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleChange('type', type.id)}
                disabled={!canCreateEvent}
                className={cn(
                  'glass-card p-3 text-center transition-all',
                  'flex flex-col items-center gap-1',
                  formData.type === type.id ? 'border-primary bg-primary/10' : 'hover:border-primary/50',
                  !canCreateEvent && 'opacity-50 cursor-not-allowed'
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
            <label className="text-sm text-muted-foreground mb-2 block">{t('host.dateRequired')}</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={!canCreateEvent}
                className="w-full input-neon bg-card border border-border pl-12 disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">{t('host.timeRequired')}</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                disabled={!canCreateEvent}
                className="w-full input-neon bg-card border border-border pl-12 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Location Name */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">{t('host.venueNameRequired')}</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('host.venueNamePlaceholder')}
              value={formData.location_name}
              onChange={(e) => handleChange('location_name', e.target.value)}
              disabled={!canCreateEvent}
              className="w-full input-neon bg-card border border-border pl-12 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Address with Privacy Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Address (Optional)</label>
            <div className="flex items-center gap-2">
              {formData.show_address ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {formData.show_address ? 'Public' : 'Hidden'}
              </span>
              <Switch
                checked={formData.show_address}
                onCheckedChange={(checked) => handleChange('show_address', checked)}
                disabled={!canCreateEvent}
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="e.g., 123 Main Street, Apt 4B"
            value={formData.location_address}
            onChange={(e) => handleChange('location_address', e.target.value)}
            disabled={!canCreateEvent}
            className="w-full input-neon bg-card border border-border disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            {formData.show_address 
              ? '📍 Address will be visible to all attendees'
              : '🔒 Address hidden until RSVP confirmed (for privacy)'
            }
          </p>
        </div>

        {/* City */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">{t('host.city')}</label>
          <select 
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            disabled={!canCreateEvent}
            className="w-full input-neon bg-card border border-border disabled:opacity-50"
          >
            {HUNGARIAN_CITIES.map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
          </select>
        </div>

        {/* Price & Age */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">{t('host.entryPriceFt')}</label>
            <div className="relative">
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                placeholder={t('host.freeEquals')}
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                disabled={!canCreateEvent}
                className="w-full input-neon bg-card border border-border pl-12 disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">{t('host.ageLimitLabel')}</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select 
                value={formData.age_limit}
                onChange={(e) => handleChange('age_limit', e.target.value)}
                disabled={!canCreateEvent}
                className="w-full input-neon bg-card border border-border pl-12 appearance-none disabled:opacity-50"
              >
                <option value="18">18+</option>
                <option value="21">21+</option>
                <option value="25">25+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">{t('host.description')}</label>
          <div className="relative">
            <Info className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <textarea
              placeholder={t('host.tellAboutEvent')}
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={!canCreateEvent}
              className="w-full input-neon bg-card border border-border pl-12 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Music Genres */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Music className="w-4 h-4" />
            Music Genres (max 5)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(genre => (
              <Badge
                key={genre}
                variant={formData.music_genres.includes(genre) ? "default" : "outline"}
                className={cn(
                  'cursor-pointer transition-all',
                  formData.music_genres.includes(genre)
                    ? 'bg-primary hover:bg-primary/90'
                    : 'hover:border-primary/50',
                  !canCreateEvent && 'opacity-50 pointer-events-none'
                )}
                onClick={() => canCreateEvent && toggleGenre(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <Plus className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-45")} />
            More Options
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
        </button>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              {/* End Time */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">End Time (Optional)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleChange('end_time', e.target.value)}
                    disabled={!canCreateEvent}
                    className="w-full input-neon bg-card border border-border pl-12 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">{t('host.expectedAttendance')}</label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.expected_attendance}
                    onChange={(e) => handleChange('expected_attendance', e.target.value)}
                    disabled={!canCreateEvent}
                    className="w-full input-neon bg-card border border-border disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Max Capacity</label>
                  <input
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.max_attendees}
                    onChange={(e) => handleChange('max_attendees', e.target.value)}
                    disabled={!canCreateEvent}
                    className="w-full input-neon bg-card border border-border disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Dress Code */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Shirt className="w-4 h-4" />
                  Dress Code
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DRESS_CODE_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleChange('dress_code', option.id)}
                      disabled={!canCreateEvent}
                      className={cn(
                        'glass-card p-3 text-center transition-all',
                        'flex flex-col items-center gap-1',
                        formData.dress_code === option.id ? 'border-primary bg-primary/10' : 'hover:border-primary/50',
                        !canCreateEvent && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="text-xl">{option.icon}</span>
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety Rules / House Rules */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  House Rules (Optional)
                </label>
                <textarea
                  placeholder="e.g., No smoking inside, BYOB allowed, Respect neighbors..."
                  rows={3}
                  value={formData.safety_rules}
                  onChange={(e) => handleChange('safety_rules', e.target.value)}
                  disabled={!canCreateEvent}
                  className="w-full input-neon bg-card border border-border resize-none disabled:opacity-50"
                />
              </div>

              {/* Contact Info with Privacy Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Info (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formData.show_contact ? 'Public' : 'RSVP only'}
                    </span>
                    <Switch
                      checked={formData.show_contact}
                      onCheckedChange={(checked) => handleChange('show_contact', checked)}
                      disabled={!canCreateEvent}
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="e.g., WhatsApp: +36 XX XXX XXXX"
                  value={formData.contact_info}
                  onChange={(e) => handleChange('contact_info', e.target.value)}
                  disabled={!canCreateEvent}
                  className="w-full input-neon bg-card border border-border disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.show_contact 
                    ? '📞 Contact visible to everyone'
                    : '🔒 Only visible to confirmed attendees'
                  }
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Co-Hosts Section */}
        {canCreateEvent && (
          <div className="glass-card p-4">
            <CohostManager 
              onCohostsChange={setPendingCohostIds}
              initialCohosts={pendingCohostIds}
            />
          </div>
        )}
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40">
        <Button 
          variant="neon" 
          size="xl" 
          className="w-full gap-2"
          disabled={!canCreateEvent || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
              <>
              <Plus className="w-5 h-5" />
              {t('host.createEvent')}
            </>
          )}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default CreateEvent;
