import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Calendar, MapPin, QrCode, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { TicketPurchase } from '@/hooks/useTickets';
import { format } from 'date-fns';

interface TicketCardProps {
  purchase: TicketPurchase;
}

export const TicketCard: React.FC<TicketCardProps> = ({ purchase }) => {
  const { t } = useLanguage();
  const [showQR, setShowQR] = useState(false);

  const event = purchase.event;
  const isUpcoming = event ? new Date(event.start_time) > new Date() : false;
  const isUsed = purchase.status === 'used';

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  return (
    <>
      <Card className={`overflow-hidden ${isUsed ? 'opacity-60' : ''}`}>
        <div className="flex">
          {/* Event Image */}
          {event?.cover_image && (
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0">
              <img
                src={event.cover_image}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Ticket Info */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold line-clamp-1">
                  {event?.name || 'Event'}
                </h3>
                {purchase.ticket && (
                  <Badge variant="secondary" className="mt-1">
                    {purchase.ticket.name}
                  </Badge>
                )}
              </div>
              <Badge variant={isUsed ? 'secondary' : isUpcoming ? 'default' : 'outline'}>
                {isUsed ? 'Used' : isUpcoming ? 'Upcoming' : 'Past'}
              </Badge>
            </div>

            {event && (
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(event.start_time), 'MMM d, yyyy • HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{event.location_name}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="font-medium">
                {formatPrice(purchase.price_paid_cents)}
              </span>
              {isUpcoming && !isUsed && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQR(true)}
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  {t('tickets.showQR')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{t('tickets.ticketDetails')}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowQR(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* QR Code Display */}
              <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-32 w-32 text-black mx-auto" />
                  <p className="mt-2 font-mono text-sm text-black break-all">
                    {purchase.qr_code}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('tickets.orderNumber')}</span>
                  <span className="font-mono">{purchase.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('tickets.purchaseDate')}</span>
                  <span>{format(new Date(purchase.purchased_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
