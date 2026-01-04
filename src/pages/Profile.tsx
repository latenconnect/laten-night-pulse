import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, ChevronRight, Calendar, Heart, MapPin, 
  Bell, Shield, LogOut, Sparkles, User as UserIcon, LayoutDashboard, 
  BadgeCheck, ShieldCheck, Loader2, Globe, Trash2, AlertTriangle,
  Camera, Pencil, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import MobileLayout from '@/components/layouts/MobileLayout';
import HostApplicationCard from '@/components/HostApplicationCard';
import PartyBoostCard from '@/components/PartyBoostCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAgeVerification } from '@/hooks/useAgeVerification';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  age_verified: boolean | null;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity, interests } = useApp();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { startVerification, loading: verificationLoading } = useAgeVerification();

  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check admin role server-side
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(!!data);
    };
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, bio, city, age_verified')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      setProfile(data);
      setEditName(data.display_name || '');
      setEditBio(data.bio || '');
      setEditCity(data.city || '');
    }
    setLoading(false);
  };

  const handleOpenEditSheet = () => {
    if (profile) {
      setEditName(profile.display_name || '');
      setEditBio(profile.bio || '');
      setEditCity(profile.city || '');
    }
    setEditSheetOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editName.trim() || null,
          bio: editBio.trim() || null,
          city: editCity.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        display_name: editName.trim() || null,
        bio: editBio.trim() || null,
        city: editCity.trim() || null
      } : null);
      
      toast.success('Profile updated!');
      setEditSheetOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL (add timestamp to bust cache)
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      toast.success('Profile picture updated!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVerifyAge = async () => {
    const result = await startVerification();
    if (result?.url) {
      window.open(result.url, '_blank');
      toast.info('Complete verification in the new tab. Your status will update automatically.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeletingAccount(true);
    try {
      const { error } = await supabase.rpc('delete_user_account', {
        user_id_to_delete: user.id
      });
      
      if (error) throw error;
      
      // Sign out and delete from auth
      await supabase.auth.signOut();
      
      toast.success('Your account has been deleted successfully');
      navigate('/auth');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const menuItems = [
    { icon: Calendar, label: t('profile.myEvents'), count: 3, path: '/saved' },
    { icon: Heart, label: t('profile.savedEvents'), count: 12, path: '/saved' },
    { icon: Bell, label: t('profile.notifications'), path: undefined, action: () => toast.info('Push notifications settings coming soon!') },
    { icon: MapPin, label: t('onboarding.selectCity'), value: selectedCity, path: '/onboarding' },
    { icon: Sparkles, label: t('onboarding.selectInterests'), path: '/onboarding' },
    { icon: Globe, label: t('profile.language'), customRight: <LanguageSwitcher />, path: undefined },
    { icon: Shield, label: t('profile.privacy'), path: '/privacy' },
    { icon: Settings, label: t('auth.termsOfService'), path: '/terms' },
  ];

  return (
    <MobileLayout>
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Header */}
      <header className="relative">
        {/* Background Gradient */}
        <div className="h-40 bg-gradient-to-br from-primary/30 via-neon-pink/20 to-secondary/30 safe-top" />
        
        {/* Profile Card */}
        <div className="px-4 -mt-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-start gap-4">
              {/* Avatar with upload button */}
              <div className="relative">
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar || !user}
                  className="relative group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5">
                    <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center overflow-hidden">
                      {uploadingAvatar ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {user && (
                    <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
                {user && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center border-2 border-card">
                    <span className="text-xs">✓</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                {user ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="font-display font-bold text-xl mb-1">
                          {profile?.display_name || user.email?.split('@')[0]}
                        </h1>
                        <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                        <p className="text-xs text-primary">{profile?.city || selectedCity}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleOpenEditSheet}
                        className="shrink-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                    {profile?.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>
                    )}
                  </>
                ) : (
                  <>
                    <h1 className="font-display font-bold text-xl mb-1">{t('common.loading')}</h1>
                    <p className="text-sm text-muted-foreground mb-3">{t('auth.signIn')}</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                      {t('auth.signIn')}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-primary">0</p>
                <p className="text-xs text-muted-foreground">{t('events.attendees')}</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-secondary">12</p>
                <p className="text-xs text-muted-foreground">{t('events.saved')}</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-neon-pink">3</p>
                <p className="text-xs text-muted-foreground">{t('tickets.upcomingEvents')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Edit Profile Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-xl font-display">Edit Profile</SheetTitle>
            <SheetDescription>
              Update your profile information
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* Avatar section in edit sheet */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="relative group"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                    {uploadingAvatar ? (
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              <p className="text-sm text-muted-foreground">Tap to change photo</p>
            </div>

            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
              />
            </div>

            {/* Bio field */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="min-h-[100px] resize-none"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">{editBio.length}/300</p>
            </div>

            {/* City field */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="Your city"
                maxLength={100}
              />
            </div>

            {/* Save button */}
            <div className="pt-4">
              <Button
                variant="neon"
                className="w-full"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Interests */}
      <section className="px-4 mt-6">
        <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          {t('onboarding.selectInterests')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {interests.length > 0 ? (
            interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm"
              >
                {interest}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
          )}
        </div>
      </section>

      {/* Menu */}
      <section className="px-4 mt-6">
        <div className="glass-card overflow-hidden">
          {menuItems.map((item) => (
            <motion.div
              key={item.label}
              onClick={() => item.path ? navigate(item.path) : item.action?.()}
              whileTap={item.path || item.action ? { scale: 0.98 } : undefined}
              className={`w-full flex items-center gap-4 p-4 border-b border-border/50 last:border-0 ${item.path || item.action ? 'touch-highlight touch-target no-select cursor-pointer' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                  {item.count}
                </span>
              )}
              {item.value && (
                <span className="text-sm text-muted-foreground">{item.value}</span>
              )}
              {item.customRight && item.customRight}
              {(item.path || item.action) && !item.customRight && (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Admin Dashboard Link - Only visible to admins */}
      {isAdmin && (
        <section className="px-4 mt-6">
          <motion.button
            onClick={() => navigate('/admin')}
            whileTap={{ scale: 0.98 }}
            className="w-full glass-card p-4 flex items-center gap-4 border-2 border-primary/30 touch-highlight"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <span className="flex-1 text-left font-medium">{t('profile.adminDashboard')}</span>
            <ChevronRight className="w-5 h-5 text-primary" />
          </motion.button>
        </section>
      )}

      {/* ID Verification */}
      {user && (
        <section className="px-4 mt-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                profile?.age_verified ? 'bg-secondary/20' : 'bg-primary/20'
              }`}>
                {profile?.age_verified ? (
                  <ShieldCheck className="w-6 h-6 text-secondary" />
                ) : (
                  <BadgeCheck className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {profile?.age_verified ? t('onboarding.ageVerification') : t('onboarding.ageVerification')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.age_verified 
                    ? t('onboarding.mustBe18')
                    : t('onboarding.verifyAge')}
                </p>
              </div>
              {!profile?.age_verified && (
                <Button
                  variant="neon"
                  size="sm"
                  onClick={handleVerifyAge}
                  disabled={verificationLoading}
                >
                  {verificationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Host CTA */}
      <section className="px-4 mt-6">
        <HostApplicationCard />
      </section>

      {/* Party Boost Subscription */}
      <section className="px-4 mt-6">
        <PartyBoostCard />
      </section>

      {/* Sign Out */}
      {user && (
        <section className="px-4 mt-6 space-y-3">
          <Button 
            variant="ghost" 
            className="w-full text-destructive hover:text-destructive gap-2 touch-target"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            {t('profile.signOut')}
          </Button>
          
          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-destructive gap-2 touch-target"
              >
                <Trash2 className="w-5 h-5" />
                {t('profile.deleteAccount') || 'Delete Account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {t('profile.deleteAccountTitle') || 'Delete Your Account?'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left space-y-2">
                  <p>{t('profile.deleteAccountWarning') || 'This action cannot be undone. All your data will be permanently deleted, including:'}</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Your profile and settings</li>
                    <li>All messages and conversations</li>
                    <li>Event RSVPs and saved events</li>
                    <li>DJ/Bartender profiles and bookings</li>
                    <li>Stories and social connections</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deletingAccount ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  {t('profile.deleteAccount') || 'Delete Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      )}
    </MobileLayout>
  );
};

export default Profile;
