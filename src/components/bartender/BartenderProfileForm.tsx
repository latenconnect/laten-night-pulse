import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wine, User, Link, DollarSign, MapPin, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/LanguageContext';
import { BartenderProfile, BARTENDER_SKILLS, BARTENDER_EVENT_TYPES, useCreateBartenderProfile, useUpdateBartenderProfile } from '@/hooks/useBartenders';

const HUNGARIAN_CITIES = [
  'Budapest', 'Debrecen', 'Szeged', 'Pécs', 'Győr', 'Siófok', 
  'Miskolc', 'Eger', 'Veszprém', 'Székesfehérvár', 'Sopron', 
  'Nyíregyháza', 'Kaposvár', 'Balatonfüred', 'Tokaj', 'Kecskemét',
  'Dunaújváros', 'Esztergom', 'Hévíz', 'Zamárdi'
];

interface BartenderProfileFormProps {
  existingProfile?: BartenderProfile | null;
  onSuccess?: () => void;
}

export const BartenderProfileForm = ({ existingProfile, onSuccess }: BartenderProfileFormProps) => {
  const { t } = useLanguage();
  const createProfile = useCreateBartenderProfile();
  const updateProfile = useUpdateBartenderProfile();

  const [formData, setFormData] = useState({
    bartender_name: '',
    bio: '',
    profile_photo: '',
    skills: [] as string[],
    experience_level: 'intermediate',
    instagram_url: '',
    price_min: '',
    price_max: '',
    preferred_event_types: [] as string[],
    city: 'Budapest',
  });

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        bartender_name: existingProfile.bartender_name,
        bio: existingProfile.bio || '',
        profile_photo: existingProfile.profile_photo || '',
        skills: existingProfile.skills,
        experience_level: existingProfile.experience_level,
        instagram_url: existingProfile.instagram_url || '',
        price_min: existingProfile.price_min?.toString() || '',
        price_max: existingProfile.price_max?.toString() || '',
        preferred_event_types: existingProfile.preferred_event_types,
        city: existingProfile.city,
      });
    }
  }, [existingProfile]);

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
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
      bartender_name: formData.bartender_name,
      bio: formData.bio || null,
      profile_photo: formData.profile_photo || null,
      skills: formData.skills,
      experience_level: formData.experience_level,
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
            <User className="h-5 w-5 text-amber-500" />
            {t('basicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('bartenderName')} *</Label>
            <Input
              value={formData.bartender_name}
              onChange={(e) => setFormData({ ...formData, bartender_name: e.target.value })}
              placeholder="Your Name"
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

      {/* Skills */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wine className="h-5 w-5 text-amber-500" />
            {t('skills')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BARTENDER_SKILLS.map((skill) => (
              <Badge
                key={skill}
                variant={formData.skills.includes(skill) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${formData.skills.includes(skill) ? 'bg-amber-500 text-black' : ''}`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-amber-500" />
            {t('preferredEventTypes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BARTENDER_EVENT_TYPES.map((type) => (
              <Badge
                key={type}
                variant={formData.preferred_event_types.includes(type) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${formData.preferred_event_types.includes(type) ? 'bg-amber-500 text-black' : ''}`}
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
            <Link className="h-5 w-5 text-amber-500" />
            {t('socialLinks')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <DollarSign className="h-5 w-5 text-amber-500" />
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
        className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-black" 
        size="lg"
        onClick={handleSubmit}
        disabled={isLoading || !formData.bartender_name}
      >
        <Save className="h-4 w-4" />
        {isLoading ? t('saving') : (existingProfile ? t('updateProfile') : t('createProfile'))}
      </Button>
    </motion.div>
  );
};
