import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, User, Link, DollarSign, MapPin, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/LanguageContext';
import { DJProfile, MUSIC_GENRES, EVENT_TYPES, useCreateDJProfile, useUpdateDJProfile } from '@/hooks/useDJs';

const HUNGARIAN_CITIES = [
  'Budapest', 'Debrecen', 'Szeged', 'Pécs', 'Győr', 'Siófok', 
  'Miskolc', 'Eger', 'Veszprém', 'Székesfehérvár', 'Sopron', 
  'Nyíregyháza', 'Kaposvár', 'Balatonfüred', 'Tokaj', 'Kecskemét',
  'Dunaújváros', 'Esztergom', 'Hévíz', 'Zamárdi'
];

interface DJProfileFormProps {
  existingProfile?: DJProfile | null;
  onSuccess?: () => void;
}

export const DJProfileForm = ({ existingProfile, onSuccess }: DJProfileFormProps) => {
  const { t } = useLanguage();
  const createProfile = useCreateDJProfile();
  const updateProfile = useUpdateDJProfile();

  const [formData, setFormData] = useState({
    dj_name: '',
    bio: '',
    profile_photo: '',
    genres: [] as string[],
    experience_level: 'intermediate',
    soundcloud_url: '',
    mixcloud_url: '',
    instagram_url: '',
    price_min: '',
    price_max: '',
    preferred_event_types: [] as string[],
    city: 'Budapest',
  });

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        dj_name: existingProfile.dj_name,
        bio: existingProfile.bio || '',
        profile_photo: existingProfile.profile_photo || '',
        genres: existingProfile.genres,
        experience_level: existingProfile.experience_level,
        soundcloud_url: existingProfile.soundcloud_url || '',
        mixcloud_url: existingProfile.mixcloud_url || '',
        instagram_url: existingProfile.instagram_url || '',
        price_min: existingProfile.price_min?.toString() || '',
        price_max: existingProfile.price_max?.toString() || '',
        preferred_event_types: existingProfile.preferred_event_types,
        city: existingProfile.city,
      });
    }
  }, [existingProfile]);

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const toggleEventType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_event_types: prev.preferred_event_types.includes(type)
        ? prev.preferred_event_types.filter(t => t !== type)
        : [...prev.preferred_event_types, type],
    }));
  };

  const handleSubmit = async () => {
    const profileData = {
      dj_name: formData.dj_name,
      bio: formData.bio || null,
      profile_photo: formData.profile_photo || null,
      genres: formData.genres,
      experience_level: formData.experience_level,
      soundcloud_url: formData.soundcloud_url || null,
      mixcloud_url: formData.mixcloud_url || null,
      instagram_url: formData.instagram_url || null,
      price_min: formData.price_min ? parseInt(formData.price_min) : null,
      price_max: formData.price_max ? parseInt(formData.price_max) : null,
      preferred_event_types: formData.preferred_event_types,
      city: formData.city,
    };

    try {
      if (existingProfile) {
        await updateProfile.mutateAsync({ id: existingProfile.id, ...profileData });
      } else {
        await createProfile.mutateAsync(profileData);
      }
      onSuccess?.();
    } catch (error) {
      // Error handled in hooks
    }
  };

  const isLoading = createProfile.isPending || updateProfile.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Basic Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            {t('basicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('djName')} *</Label>
            <Input
              value={formData.dj_name}
              onChange={(e) => setFormData({ ...formData, dj_name: e.target.value })}
              placeholder="DJ Name"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('bio')}</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={t('tellAboutYourself')}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('profilePhotoUrl')}</Label>
            <Input
              value={formData.profile_photo}
              onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('city')}</Label>
              <Select 
                value={formData.city} 
                onValueChange={(value) => setFormData({ ...formData, city: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HUNGARIAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('experienceLevel')}</Label>
              <Select 
                value={formData.experience_level} 
                onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t('beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
                  <SelectItem value="professional">{t('professional')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Music Genres */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="h-5 w-5 text-primary" />
            {t('musicGenres')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MUSIC_GENRES.map((genre) => (
              <Badge
                key={genre}
                variant={formData.genres.includes(genre) ? "default" : "outline"}
                className="cursor-pointer transition-all"
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            {t('preferredEventTypes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((type) => (
              <Badge
                key={type}
                variant={formData.preferred_event_types.includes(type) ? "default" : "outline"}
                className="cursor-pointer transition-all"
                onClick={() => toggleEventType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link className="h-5 w-5 text-primary" />
            {t('socialLinks')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SoundCloud</Label>
            <Input
              value={formData.soundcloud_url}
              onChange={(e) => setFormData({ ...formData, soundcloud_url: e.target.value })}
              placeholder="https://soundcloud.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Mixcloud</Label>
            <Input
              value={formData.mixcloud_url}
              onChange={(e) => setFormData({ ...formData, mixcloud_url: e.target.value })}
              placeholder="https://mixcloud.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://instagram.com/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            {t('pricing')} (HUF)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>{t('minimumPrice')}</Label>
              <Input
                type="number"
                value={formData.price_min}
                onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                placeholder="30000"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>{t('maximumPrice')}</Label>
              <Input
                type="number"
                value={formData.price_max}
                onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                placeholder="100000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        className="w-full gap-2" 
        size="lg"
        onClick={handleSubmit}
        disabled={isLoading || !formData.dj_name}
      >
        <Save className="h-4 w-4" />
        {isLoading ? t('saving') : (existingProfile ? t('updateProfile') : t('createProfile'))}
      </Button>
    </motion.div>
  );
};
