import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Briefcase, DollarSign, Send, Music, Wine, Camera, Shield } from 'lucide-react';
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
import { Professional, EVENT_TYPES, PROFESSION_LABELS, useCreateBookingRequest } from '@/hooks/useProfessionals';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BookProfessionalSheetProps {
  professional: Professional;
  isOpen: boolean;
  onClose: () => void;
}

const professionIcons = {
  dj: Music,
  bartender: Wine,
  photographer: Camera,
  security: Shield,
};

export const BookProfessionalSheet = ({ professional, isOpen, onClose }: BookProfessionalSheetProps) => {
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

  const ProfessionIcon = professionIcons[professional.profession_type] || Briefcase;

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('auth.loginRequired') || 'Please log in to book');
      navigate('/auth');
      return;
    }

    if (!eventDate || !eventType) {
      toast.error(t('common.fillRequiredFields') || 'Please fill in required fields');
      return;
    }

    const bookerName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Someone';

    try {
      await createBooking.mutateAsync({
        professional_id: professional.id,
        event_date: format(eventDate, 'yyyy-MM-dd'),
        event_type: eventType,
        event_location: eventLocation || undefined,
        event_description: eventDescription || undefined,
        budget_min: budgetMin ? parseInt(budgetMin) : undefined,
        budget_max: budgetMax ? parseInt(budgetMax) : undefined,
        currency: professional.currency || 'HUF',
        message: message || undefined,
        status: 'pending',
      });
      toast.success(t('professionals.bookingRequestSent') || 'Booking request sent!');
      onClose();
      // Reset form
      setEventDate(undefined);
      setEventType('');
      setEventLocation('');
      setEventDescription('');
      setBudgetMin('');
      setBudgetMax('');
      setMessage('');
    } catch (error) {
      toast.error(t('common.error') || 'Failed to send booking request');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <ProfessionIcon className="h-5 w-5 text-primary" />
            {t('professionals.book') || 'Book'}: {professional.display_name}
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
              {t('professionals.eventDate') || 'Event Date'} *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  {eventDate ? format(eventDate, 'PPP') : (t('professionals.selectDate') || 'Select date')}
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
              <Briefcase className="h-4 w-4 text-primary" />
              {t('professionals.eventType') || 'Event Type'} *
            </Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder={t('professionals.selectEventType') || 'Select event type'} />
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
              {t('professionals.eventLocation') || 'Event Location'}
            </Label>
            <Input
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder={t('professionals.enterLocation') || 'Enter location'}
            />
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              {t('professionals.budgetRange') || 'Budget Range'} ({professional.currency || 'HUF'})
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder={t('common.min') || 'Min'}
              />
              <span className="flex items-center text-muted-foreground">-</span>
              <Input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder={t('common.max') || 'Max'}
              />
            </div>
          </div>

          {/* Event Description */}
          <div className="space-y-2">
            <Label>{t('professionals.eventDescription') || 'Event Description'}</Label>
            <Textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder={t('professionals.describeEvent') || 'Describe your event...'}
              rows={3}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>{t('professionals.messageToProfessional') || 'Message'}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('professionals.writeMessage') || 'Write a message...'}
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
            {createBooking.isPending 
              ? (t('common.sending') || 'Sending...') 
              : (t('professionals.sendBookingRequest') || 'Send Booking Request')}
          </Button>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};
