import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music, User, Calendar, MessageCircle, Crown, Wine, Camera, Shield, Upload, X, Plus } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MobileLayout from '@/components/layouts/MobileLayout';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { 
  useMyProfessionalProfile, 
  useMyProfessionalSubscription, 
  useMyProfessionalBookings, 
  useCreateProfessionalProfile, 
  useUpdateProfessionalProfile,
  MUSIC_GENRES,
  BARTENDER_SKILLS,
  PHOTOGRAPHER_SKILLS,
  SECURITY_SKILLS,
  EVENT_TYPES,
  ProfessionType
} from '@/hooks/useProfessionals';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

const professionTypes = [
  { value: 'dj', label: 'DJ', icon: Music },
  { value: 'bartender', label: 'Bartender', icon: Wine },
  { value: 'photographer', label: 'Photographer', icon: Camera },
  { value: 'security', label: 'Security', icon: Shield },
];

const getSkillsForProfession = (type: ProfessionType) => {
  switch (type) {
    case 'dj': return MUSIC_GENRES;
    case 'bartender': return BARTENDER_SKILLS;
    case 'photographer': return PHOTOGRAPHER_SKILLS;
    case 'security': return SECURITY_SKILLS;
    default: return [];
  }
};

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useMyProfessionalProfile();
  const { data: subscription, isLoading: subscriptionLoading } = useMyProfessionalSubscription();
  const { data: bookingRequests } = useMyProfessionalBookings();
  const createProfile = useCreateProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();
  const { createCheckout } = useSubscription();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [professionType, setProfessionType] = useState<ProfessionType>('dj');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('Budapest');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setProfessionType(profile.profession_type);
      setBio(profile.bio || '');
      setCity(profile.city || 'Budapest');
      setPriceMin(profile.price_min?.toString() || '');
      setPriceMax(profile.price_max?.toString() || '');
      setInstagramUrl(profile.instagram_url || '');
      setSelectedSkills(profile.skills || []);
      setSelectedGenres(profile.genres || []);
      setSelectedEventTypes(profile.preferred_event_types || []);
      setProfilePhoto(profile.profile_photo);
    }
  }, [profile]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('professional-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('professional-photos')
        .getPublicUrl(fileName);

      setProfilePhoto(publicUrl);

      // If profile exists, update it immediately
      if (profile) {
        await updateProfile.mutateAsync({ id: profile.id, profile_photo: publicUrl });
        toast.success('Photo updated!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventType) ? prev.filter(e => e !== eventType) : [...prev, eventType]
    );
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    const formData = {
      display_name: displayName,
      profession_type: professionType,
      bio,
      city,
      price_min: priceMin ? parseInt(priceMin) : null,
      price_max: priceMax ? parseInt(priceMax) : null,
      instagram_url: instagramUrl,
      skills: professionType !== 'dj' ? selectedSkills : [],
      genres: professionType === 'dj' ? selectedGenres : [],
      preferred_event_types: selectedEventTypes,
      profile_photo: profilePhoto,
    };

    try {
      if (profile) {
        await updateProfile.mutateAsync({ id: profile.id, ...formData });
        toast.success(t('professionals.profileUpdated'));
      } else {
        await createProfile.mutateAsync(formData);
        toast.success(t('professionals.profileCreated'));
        refetchProfile();
      }
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleSubscribe = async () => {
    if (!profile) return;
    await createCheckout('professional_standard', profile.id);
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

  const selectedProfession = professionTypes.find(p => p.value === professionType);
  const ProfessionIcon = selectedProfession?.icon || Music;
  const availableSkills = getSkillsForProfession(professionType);

  // Profile form component (shared between create and edit)
  const ProfileForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarImage src={profilePhoto || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              <ProfessionIcon className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <p className="text-xs text-muted-foreground">Tap to upload photo</p>
      </div>

      {/* Profession Type (only on create) */}
      {!isEdit && (
        <div>
          <Label>{t('professionals.professionType')}</Label>
          <Select value={professionType} onValueChange={(v) => setProfessionType(v as ProfessionType)}>
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
      )}

      {/* Basic Info */}
      <div>
        <Label>{t('professionals.displayName')}</Label>
        <Input 
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)} 
          placeholder="Your professional name" 
        />
      </div>

      <div>
        <Label>{t('professionals.city')}</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Budapest" />
      </div>

      <div>
        <Label>{t('professionals.bio')}</Label>
        <Textarea 
          value={bio} 
          onChange={(e) => setBio(e.target.value)} 
          placeholder="Tell clients about yourself, your experience, and what makes you unique..." 
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
      </div>

      {/* Skills/Genres based on profession type */}
      {professionType === 'dj' ? (
        <div>
          <Label className="mb-2 block">Music Genres</Label>
          <div className="flex flex-wrap gap-2">
            {MUSIC_GENRES.map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleGenre(genre)}
              >
                {selectedGenres.includes(genre) && <X className="h-3 w-3 mr-1" />}
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <Label className="mb-2 block">Skills</Label>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((skill) => (
              <Badge
                key={skill}
                variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleSkill(skill)}
              >
                {selectedSkills.includes(skill) && <X className="h-3 w-3 mr-1" />}
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Event Types */}
      <div>
        <Label className="mb-2 block">Preferred Event Types</Label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((eventType) => (
            <Badge
              key={eventType}
              variant={selectedEventTypes.includes(eventType) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => toggleEventType(eventType)}
            >
              {selectedEventTypes.includes(eventType) && <X className="h-3 w-3 mr-1" />}
              {eventType}
            </Badge>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t('professionals.priceMin')} (HUF)</Label>
          <Input 
            type="number" 
            value={priceMin} 
            onChange={(e) => setPriceMin(e.target.value)} 
            placeholder="50000" 
          />
        </div>
        <div>
          <Label>{t('professionals.priceMax')} (HUF)</Label>
          <Input 
            type="number" 
            value={priceMax} 
            onChange={(e) => setPriceMax(e.target.value)} 
            placeholder="150000" 
          />
        </div>
      </div>

      {/* Social Links */}
      <div>
        <Label>Instagram</Label>
        <Input 
          value={instagramUrl} 
          onChange={(e) => setInstagramUrl(e.target.value)} 
          placeholder="https://instagram.com/yourprofile" 
        />
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full" 
        disabled={createProfile.isPending || updateProfile.isPending}
      >
        {(createProfile.isPending || updateProfile.isPending) 
          ? t('common.saving') 
          : isEdit ? t('professionals.saveChanges') : t('professionals.createProfile')
        }
      </Button>
    </div>
  );

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
                  <ProfileForm isEdit={false} />
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
                    <ProfileForm isEdit={true} />
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
                        <Button onClick={handleSubscribe} className="w-full">
                          {t('professionals.subscribe')}
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
