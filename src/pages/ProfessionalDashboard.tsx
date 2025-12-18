import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music, User, Calendar, MessageCircle, Crown, Wine, Camera, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MobileLayout from '@/components/layouts/MobileLayout';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useMyProfessionalProfile, useMyProfessionalSubscription, useMyProfessionalBookings, useCreateProfessionalProfile, useUpdateProfessionalProfile } from '@/hooks/useProfessionals';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

const professionTypes = [
  { value: 'dj', label: 'DJ', icon: Music },
  { value: 'bartender', label: 'Bartender', icon: Wine },
  { value: 'photographer', label: 'Photographer', icon: Camera },
  { value: 'security', label: 'Security', icon: Shield },
];

interface ProfileFormData {
  display_name: string;
  profession_type: 'dj' | 'bartender' | 'photographer' | 'security';
  bio: string;
  city: string;
  price_min: number | null;
  price_max: number | null;
  instagram_url: string;
}

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const { data: profile, isLoading: profileLoading } = useMyProfessionalProfile();
  const { data: subscription, isLoading: subscriptionLoading } = useMyProfessionalSubscription();
  const { data: bookingRequests } = useMyProfessionalBookings();
  const createProfile = useCreateProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();

  const [subscribing, setSubscribing] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      display_name: profile?.display_name || '',
      profession_type: profile?.profession_type || 'dj',
      bio: profile?.bio || '',
      city: profile?.city || 'Budapest',
      price_min: profile?.price_min || null,
      price_max: profile?.price_max || null,
      instagram_url: profile?.instagram_url || '',
    }
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubscribe = async () => {
    setSubscribing(true);
    toast.info(t('professionals.paymentComingSoon'));
    setSubscribing(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      if (profile) {
        await updateProfile.mutateAsync({ id: profile.id, ...data });
        toast.success(t('professionals.profileUpdated'));
      } else {
        await createProfile.mutateAsync(data);
        toast.success(t('professionals.profileCreated'));
      }
    } catch (error) {
      toast.error(t('common.error'));
    }
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

  const selectedProfession = professionTypes.find(p => p.value === watch('profession_type'));
  const ProfessionIcon = selectedProfession?.icon || Music;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/professionals')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            {profile && isSubscribed && (
              <Badge className="bg-primary/20 text-primary border-0">
                <Crown className="h-3 w-3 mr-1" />
                {t('professionals.subscribed')}
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
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ProfessionIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {profile ? t('professionals.dashboard') : t('professionals.becomePro')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {profile ? t('professionals.manageProfile') : t('professionals.createProfileGetGigs')}
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
              <Card>
                <CardHeader>
                  <CardTitle>{t('professionals.createProfile')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label>{t('professionals.professionType')}</Label>
                      <Select 
                        value={watch('profession_type')} 
                        onValueChange={(v) => setValue('profession_type', v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {professionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('professionals.displayName')}</Label>
                      <Input {...register('display_name', { required: true })} placeholder="Your professional name" />
                    </div>

                    <div>
                      <Label>{t('professionals.city')}</Label>
                      <Input {...register('city')} placeholder="Budapest" />
                    </div>

                    <div>
                      <Label>{t('professionals.bio')}</Label>
                      <Textarea {...register('bio')} placeholder="Tell clients about yourself..." rows={3} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('professionals.priceMin')}</Label>
                        <Input type="number" {...register('price_min', { valueAsNumber: true })} placeholder="50000" />
                      </div>
                      <div>
                        <Label>{t('professionals.priceMax')}</Label>
                        <Input type="number" {...register('price_max', { valueAsNumber: true })} placeholder="150000" />
                      </div>
                    </div>

                    <div>
                      <Label>Instagram</Label>
                      <Input {...register('instagram_url')} placeholder="https://instagram.com/..." />
                    </div>

                    <Button type="submit" className="w-full" disabled={createProfile.isPending}>
                      {createProfile.isPending ? t('common.saving') : t('professionals.createProfile')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Dashboard Tabs */
            <Tabs defaultValue={isSubscribed ? "requests" : "subscription"}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="requests" className="flex-1 gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {t('professionals.requests')}
                  {pendingRequests.length > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex-1 gap-1">
                  <User className="h-4 w-4" />
                  {t('professionals.profile')}
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex-1 gap-1">
                  <Crown className="h-4 w-4" />
                  {t('professionals.subscription')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-4">
                {!isSubscribed ? (
                  <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="p-4">
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        {t('professionals.subscribeToReceiveRequests')}
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
                            <Badge variant={
                              request.status === 'pending' ? 'secondary' :
                              request.status === 'accepted' ? 'default' :
                              'outline'
                            }>
                              {request.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(request.created_at || ''), 'MMM d, yyyy')}
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
                              <p className="text-sm font-medium text-primary">
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
                              <Button size="sm" className="flex-1">
                                {t('professionals.accept')}
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                {t('professionals.decline')}
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
                    <h3 className="font-medium text-foreground mb-2">{t('professionals.noRequests')}</h3>
                    <p className="text-sm text-muted-foreground">{t('professionals.requestsWillAppear')}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile">
                <Card>
                  <CardContent className="p-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label>{t('professionals.displayName')}</Label>
                        <Input {...register('display_name', { required: true })} defaultValue={profile.display_name} />
                      </div>

                      <div>
                        <Label>{t('professionals.city')}</Label>
                        <Input {...register('city')} defaultValue={profile.city} />
                      </div>

                      <div>
                        <Label>{t('professionals.bio')}</Label>
                        <Textarea {...register('bio')} defaultValue={profile.bio || ''} rows={3} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t('professionals.priceMin')}</Label>
                          <Input type="number" {...register('price_min', { valueAsNumber: true })} defaultValue={profile.price_min || ''} />
                        </div>
                        <div>
                          <Label>{t('professionals.priceMax')}</Label>
                          <Input type="number" {...register('price_max', { valueAsNumber: true })} defaultValue={profile.price_max || ''} />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? t('common.saving') : t('professionals.saveChanges')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscription">
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      {t('professionals.proSubscription')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isSubscribed ? (
                      <>
                        <div className="p-4 rounded-lg bg-primary/10 text-center">
                          <p className="text-sm text-muted-foreground">{t('professionals.validUntil')}</p>
                          <p className="text-lg font-bold text-primary">
                            {format(new Date(subscription?.expires_at || ''), 'PPP')}
                          </p>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <span className="text-primary">✓</span> {t('professionals.receiveBookings')}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-primary">✓</span> {t('professionals.featuredProfile')}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-primary">✓</span> {t('professionals.prioritySupport')}
                          </li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary mb-1">4,000 HUF</p>
                          <p className="text-sm text-muted-foreground">{t('professionals.perMonth')}</p>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <span className="text-primary">✓</span> {t('professionals.receiveBookings')}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-primary">✓</span> {t('professionals.featuredProfile')}
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-primary">✓</span> {t('professionals.prioritySupport')}
                          </li>
                        </ul>
                        <Button 
                          className="w-full" 
                          onClick={handleSubscribe}
                          disabled={subscribing}
                        >
                          {subscribing ? t('common.processing') : t('professionals.subscribe')}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default ProfessionalDashboard;
