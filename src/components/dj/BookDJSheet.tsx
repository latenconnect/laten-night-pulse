import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Music, DollarSign, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { DJProfile, EVENT_TYPES, useCreateBookingRequest } from '@/hooks/useDJs';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BookDJSheetProps {
  dj: DJProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const BookDJSheet = ({ dj, isOpen, onClose }: BookDJSheetProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const createBooking = useCreateBookingRequest();

  const [eventDate, setEventDate] = useState<Date>();
  const [eventType, setEventType] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('loginRequired'));
      navigate('/auth');
      return;
    }

    if (!eventDate || !eventType) {
      toast.error(t('fillRequiredFields'));
      return;
    }

    // Get booker's display name from user metadata
    const bookerName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Someone';

    try {
      await createBooking.mutateAsync({
        dj_profile_id: dj.id,
        djUserId: dj.user_id,
        djName: dj.dj_name,
        bookerName,
        event_date: format(eventDate, 'yyyy-MM-dd'),
        event_type: eventType,
        event_location: eventLocation || null,
        event_description: eventDescription || null,
        budget_min: budgetMin ? parseInt(budgetMin) : null,
        budget_max: budgetMax ? parseInt(budgetMax) : null,
        currency: 'HUF',
        message: message || null,
      });
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            {t('bookDJ')}: {dj.dj_name}
          </SheetTitle>
        </SheetHeader>

        <motion.div 
          className="space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Event Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {t('eventDate')} *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  {eventDate ? format(eventDate, 'PPP') : t('selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              {t('eventType')} *
            </Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectEventType')} />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {t('eventLocation')}
            </Label>
            <Input
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder={t('enterLocation')}
            />
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              {t('budgetRange')} (HUF)
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder={t('min')}
              />
              <span className="flex items-center text-muted-foreground">-</span>
              <Input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder={t('max')}
              />
            </div>
          </div>

          {/* Event Description */}
          <div className="space-y-2">
            <Label>{t('eventDescription')}</Label>
            <Textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder={t('describeEvent')}
              rows={3}
            />
          </div>

          {/* Message to DJ */}
          <div className="space-y-2">
            <Label>{t('messageToDJ')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('writeMessage')}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={handleSubmit}
            disabled={createBooking.isPending}
          >
            <Send className="h-4 w-4" />
            {createBooking.isPending ? t('sending') : t('sendBookingRequest')}
          </Button>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};
