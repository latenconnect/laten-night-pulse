import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wine, User, Calendar, MessageCircle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MobileLayout from '@/components/layouts/MobileLayout';
import { BartenderProfileForm } from '@/components/bartender/BartenderProfileForm';
import { BartenderSubscriptionCard } from '@/components/bartender/BartenderSubscriptionCard';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useMyBartenderProfile, useMyBartenderSubscription, useBartenderBookingRequests } from '@/hooks/useBartenders';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BartenderDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const { data: profile, isLoading: profileLoading } = useMyBartenderProfile();
  const { data: subscription, isLoading: subscriptionLoading } = useMyBartenderSubscription();
  const { data: bookingRequests } = useBartenderBookingRequests();

  const [subscribing, setSubscribing] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubscribe = async () => {
    setSubscribing(true);
    // TODO: Integrate Stripe for actual payment
    toast.info(t('paymentComingSoon'));
    setSubscribing(false);
  };

  const isSubscribed = subscription?.status === 'active' && 
    subscription.expires_at && 
    new Date(subscription.expires_at) > new Date();

  const pendingRequests = bookingRequests?.filter(r => r.status === 'pending') || [];

  if (profileLoading || subscriptionLoading) {
    return (
      <MobileLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/bartenders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
            {profile && isSubscribed && (
              <Badge className="bg-amber-500/20 text-amber-500 border-0">
                <Crown className="h-3 w-3 mr-1" />
                {t('subscribed')}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Wine className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {profile ? t('bartenderDashboard') : t('becomeBartender')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {profile ? t('manageYourBartenderProfile') : t('createProfileGetGigs')}
                </p>
              </div>
            </div>
          </motion.div>

          {!profile ? (
            /* Create Profile Flow */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <BartenderProfileForm onSuccess={() => {}} />
            </motion.div>
          ) : (
            /* Dashboard Tabs */
            <Tabs defaultValue={isSubscribed ? "requests" : "subscription"}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="requests" className="flex-1 gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {t('requests')}
                  {pendingRequests.length > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center bg-amber-500 text-black text-xs">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex-1 gap-1">
                  <User className="h-4 w-4" />
                  {t('profile')}
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex-1 gap-1">
                  <Crown className="h-4 w-4" />
                  {t('subscription')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-4">
                {!isSubscribed ? (
                  <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="p-4">
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        {t('subscribeToReceiveRequests')}
                      </p>
                    </CardContent>
                  </Card>
                ) : bookingRequests && bookingRequests.length > 0 ? (
                  bookingRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant={
                                request.status === 'pending' ? 'secondary' :
                                request.status === 'accepted' ? 'default' :
                                'outline'
                              }>
                                {request.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(request.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          
                          <div className="space-y-1 mt-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{format(new Date(request.event_date), 'PPP')}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{request.event_type}</p>
                            {request.event_location && (
                              <p className="text-sm text-muted-foreground">{request.event_location}</p>
                            )}
                            {request.budget_min && request.budget_max && (
                              <p className="text-sm font-medium text-amber-500">
                                {request.budget_min.toLocaleString()} - {request.budget_max.toLocaleString()} HUF
                              </p>
                            )}
                          </div>

                          {request.message && (
                            <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                              "{request.message}"
                            </p>
                          )}

                          {request.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
                                {t('accept')}
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                {t('decline')}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground mb-2">{t('noBookingRequests')}</h3>
                    <p className="text-sm text-muted-foreground">{t('requestsWillAppearHere')}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile">
                <BartenderProfileForm existingProfile={profile} />
              </TabsContent>

              <TabsContent value="subscription">
                <BartenderSubscriptionCard 
                  subscription={subscription || null}
                  onSubscribe={handleSubscribe}
                  loading={subscribing}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default BartenderDashboard;
