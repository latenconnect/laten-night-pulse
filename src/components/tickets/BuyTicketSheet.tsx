import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, CreditCard, Loader2, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { EventTicket, usePurchaseTicket } from '@/hooks/useTickets';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface BuyTicketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tickets: EventTicket[];
  eventName: string;
}

export const BuyTicketSheet: React.FC<BuyTicketSheetProps> = ({
  open,
  onOpenChange,
  tickets,
  eventName,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { purchaseTicket, purchasing } = usePurchaseTicket();
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);
  const [success, setSuccess] = useState(false);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const handlePurchase = async () => {
    if (!user) {
      onOpenChange(false);
      navigate('/auth');
      return;
    }

    if (!selectedTicket) return;

    const result = await purchaseTicket(selectedTicket.id, selectedTicket.price_cents);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setSelectedTicket(null);
      }, 2000);
    }
  };

  const availableTickets = tickets.filter(
    (t) => t.quantity_sold < t.quantity_total
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {t('events.tickets')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{eventName}</p>
        </SheetHeader>

        {success ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ticket Purchased!</h3>
            <p className="text-muted-foreground text-center">
              Check your tickets in your profile
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4 pb-20">
            {availableTickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">{t('events.soldOut')}</p>
              </div>
            ) : (
              availableTickets.map((ticket) => {
                const remaining = ticket.quantity_total - ticket.quantity_sold;
                const isSelected = selectedTicket?.id === ticket.id;
                const isLimited = remaining < 20;

                return (
                  <motion.div
                    key={ticket.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border/50 hover:border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{ticket.name}</h4>
                            {isLimited && (
                              <Badge variant="destructive" className="text-xs">
                                {remaining} left
                              </Badge>
                            )}
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {ticket.description}
                            </p>
                          )}
                        </div>
                        <span className="text-lg font-bold">
                          {formatPrice(ticket.price_cents)}
                        </span>
                      </div>

                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-border/50"
                        >
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Check className="h-4 w-4" />
                            Selected
                          </div>
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                );
              })
            )}

            {/* Purchase Button */}
            {availableTickets.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
                <Button
                  className="w-full h-12"
                  disabled={!selectedTicket || purchasing}
                  onClick={handlePurchase}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {selectedTicket
                        ? `${t('events.buyTicket')} - ${formatPrice(selectedTicket.price_cents)}`
                        : 'Select a ticket'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
