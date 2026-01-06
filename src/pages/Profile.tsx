import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, ChevronRight, Calendar, Heart, MapPin, 
  Bell, Shield, LogOut, Sparkles, User as UserIcon, LayoutDashboard, 
  BadgeCheck, ShieldCheck, Loader2, Globe, Trash2, AlertTriangle,
  Camera, Pencil, X, Check, Grid3X3, Bookmark, Share2, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/sheet';
import MobileLayout from '@/components/layouts/MobileLayout';
import HostApplicationCard from '@/components/HostApplicationCard';
import PartyBoostCard from '@/components/PartyBoostCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFriends } from '@/hooks/useFriends';
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
  is_verified: boolean | null;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity, interests } = useApp();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { followers, following, friends } = useFriends();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const { startVerification, loading: verificationLoading } = useAgeVerification();

  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
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
      fetchSavedCount();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSavedCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('saved_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setSavedCount(count || 0);
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, bio, city, age_verified, is_verified')
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: profile?.display_name || 'My Profile',
        text: `Check out my profile on Laten!`,
        url: window.location.href
      });
    } catch {
      toast.info('Share feature not available');
    }
  };

  const settingsItems = [
    { icon: Bell, label: t('profile.notifications'), action: () => toast.info('Push notifications settings coming soon!') },
    { icon: MapPin, label: t('onboarding.selectCity'), value: selectedCity, path: '/onboarding' },
    { icon: Sparkles, label: t('onboarding.selectInterests'), path: '/onboarding' },
    { icon: Globe, label: t('profile.language'), customRight: <LanguageSwitcher /> },
    { icon: Shield, label: t('profile.privacy'), path: '/privacy' },
    { icon: Settings, label: t('auth.termsOfService'), path: '/terms' },
  ];

  const username = profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || user?.email?.split('@')[0] || 'user';

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

      {/* Instagram-style Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-display font-bold text-xl">{username}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsSheetOpen(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Profile Section */}
      <section className="px-4 py-4">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <button
            onClick={handleAvatarClick}
            disabled={uploadingAvatar || !user}
            className="relative group shrink-0"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-neon-pink to-secondary p-[3px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
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
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <Camera className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>

          {/* Stats - Instagram style */}
          <div className="flex-1 flex justify-around pt-2">
            <button className="text-center" onClick={() => navigate('/saved')}>
              <p className="font-display font-bold text-lg">{savedCount}</p>
              <p className="text-xs text-muted-foreground">{t('events.saved')}</p>
            </button>
            <button className="text-center" onClick={() => navigate('/friends')}>
              <p className="font-display font-bold text-lg">{followers.length}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </button>
            <button className="text-center" onClick={() => navigate('/friends')}>
              <p className="font-display font-bold text-lg">{following.length}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </button>
          </div>
        </div>

        {/* Name, Bio, Location */}
        <div className="mt-4 space-y-1">
          {user ? (
            <>
              <h2 className="font-semibold flex items-center gap-1">
                {profile?.display_name || user.email?.split('@')[0]}
                {profile?.is_verified && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </h2>
              {profile?.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.city}
                </p>
              )}
              {profile?.bio && (
                <p className="text-sm mt-2">{profile.bio}</p>
              )}
            </>
          ) : (
            <>
              <h2 className="font-semibold">{t('common.loading')}</h2>
              <p className="text-sm text-muted-foreground">{t('auth.signIn')}</p>
            </>
          )}
        </div>

        {/* Action Buttons - Instagram style */}
        <div className="flex gap-2 mt-4">
          {user ? (
            <>
              <Button
                variant="outline"
                className="flex-1 h-9"
                onClick={handleOpenEditSheet}
              >
                Edit profile
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-9"
                onClick={handleShare}
              >
                Share profile
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => navigate('/friends')}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="neon" className="flex-1" onClick={() => navigate('/auth')}>
              {t('auth.signIn')}
            </Button>
          )}
        </div>

        {/* Interests as story-like highlights */}
        {interests.length > 0 && (
          <div className="mt-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4">
              {interests.slice(0, 5).map((interest) => (
                <div key={interest} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center bg-muted">
                    <span className="text-lg">🎵</span>
                  </div>
                  <span className="text-xs text-center max-w-16 truncate">{interest}</span>
                </div>
              ))}
              <button 
                onClick={() => navigate('/onboarding')}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                  <span className="text-2xl text-muted-foreground">+</span>
                </div>
                <span className="text-xs text-muted-foreground">Add</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Tabs - Instagram style */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full bg-transparent border-t border-border rounded-none h-12">
          <TabsTrigger value="events" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground">
            <Grid3X3 className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground">
            <Bookmark className="w-5 h-5" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-0">
          {/* Attended/Hosted Events Grid */}
          <div className="px-4 py-6 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Events you attend</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your attended events will appear here
            </p>
            <Button variant="outline" onClick={() => navigate('/explore')}>
              Explore Events
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          {/* Saved Events */}
          <div className="px-4 py-6 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Saved events</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Save events to see them here
            </p>
            <Button variant="outline" onClick={() => navigate('/saved')}>
              View Saved
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Spacing for bottom nav */}
      <div className="pb-24" />

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

      {/* Settings Sheet */}
      <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-xl font-display">Settings</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <motion.button
                key={item.label}
                onClick={() => {
                  if (item.path) navigate(item.path);
                  else if (item.action) item.action();
                  if (!item.customRight) setSettingsSheetOpen(false);
                }}
                whileTap={item.path || item.action ? { scale: 0.98 } : undefined}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.value && (
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                )}
                {item.customRight && item.customRight}
                {(item.path || item.action) && !item.customRight && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </motion.button>
            ))}
          </div>

          {/* ID Verification */}
          {user && !profile?.age_verified && (
            <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{t('onboarding.ageVerification')}</h4>
                  <p className="text-xs text-muted-foreground">{t('onboarding.verifyAge')}</p>
                </div>
                <Button
                  variant="neon"
                  size="sm"
                  onClick={handleVerifyAge}
                  disabled={verificationLoading}
                >
                  {verificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                </Button>
              </div>
            </div>
          )}

          {/* Admin Dashboard */}
          {isAdmin && (
            <motion.button
              onClick={() => {
                navigate('/admin');
                setSettingsSheetOpen(false);
              }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <span className="flex-1 text-left font-medium">{t('profile.adminDashboard')}</span>
              <ChevronRight className="w-5 h-5 text-primary" />
            </motion.button>
          )}

          {/* Host & Party Boost Section */}
          <div className="mt-4 space-y-3">
            <HostApplicationCard />
            <PartyBoostCard />
          </div>

          {/* Sign Out & Delete */}
          {user && (
            <div className="mt-8 space-y-2">
              <Button 
                variant="ghost" 
                className="w-full text-destructive hover:text-destructive gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
                {t('profile.signOut')}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground hover:text-destructive gap-2"
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
            </div>
          )}
        </SheetContent>
      </Sheet>
    </MobileLayout>
  );
};

export default Profile;
