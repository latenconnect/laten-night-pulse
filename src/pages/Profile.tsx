import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, ChevronRight, Calendar, Heart, MapPin, 
  Bell, Shield, LogOut, Sparkles, User as UserIcon, LayoutDashboard, 
  BadgeCheck, ShieldCheck, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileLayout from '@/components/layouts/MobileLayout';
import HostApplicationCard from '@/components/HostApplicationCard';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAgeVerification } from '@/hooks/useAgeVerification';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  age_verified: boolean | null;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity, interests } = useApp();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { startVerification, loading: verificationLoading } = useAgeVerification();

  // Only show admin features for the owner
  const OWNER_EMAIL = 'aronpeterszabo@gmail.com';
  const isOwner = user?.email === OWNER_EMAIL;

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
      .select('id, display_name, avatar_url, city, age_verified')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
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

  const menuItems = [
    { icon: Calendar, label: 'My Events', count: 3, path: '/saved' },
    { icon: Heart, label: 'Saved Events', count: 12, path: '/saved' },
    { icon: Bell, label: 'Notifications', path: undefined, action: () => toast.info('Push notifications settings coming soon!') },
    { icon: MapPin, label: 'Change Location', value: selectedCity, path: '/onboarding' },
    { icon: Sparkles, label: 'Edit Interests', path: '/onboarding' },
    { icon: Shield, label: 'Privacy Policy', path: '/privacy' },
    { icon: Settings, label: 'Terms of Service', path: '/terms' },
  ];

  return (
    <MobileLayout>
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
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5">
                  <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                </div>
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
                    <h1 className="font-display font-bold text-xl mb-1">
                      {profile?.display_name || user.email?.split('@')[0]}
                    </h1>
                    <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                    <p className="text-xs text-primary">{profile?.city || selectedCity}</p>
                  </>
                ) : (
                  <>
                    <h1 className="font-display font-bold text-xl mb-1">Guest User</h1>
                    <p className="text-sm text-muted-foreground mb-3">Sign in to unlock all features</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-primary">0</p>
                <p className="text-xs text-muted-foreground">Events Attended</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-secondary">12</p>
                <p className="text-xs text-muted-foreground">Saved</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-neon-pink">3</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Interests */}
      <section className="px-4 mt-6">
        <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Your Interests
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
            <p className="text-sm text-muted-foreground">No interests selected</p>
          )}
        </div>
      </section>

      {/* Menu */}
      <section className="px-4 mt-6">
        <div className="glass-card overflow-hidden">
          {menuItems.map((item) => (
            <motion.button
              key={item.label}
              onClick={() => item.path ? navigate(item.path) : item.action?.()}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 p-4 border-b border-border/50 last:border-0 touch-highlight touch-target no-select"
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
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </section>

      {/* Admin Dashboard Link - Only visible to owner */}
      {isOwner && (
        <section className="px-4 mt-6">
          <motion.button
            onClick={() => navigate('/admin')}
            whileTap={{ scale: 0.98 }}
            className="w-full glass-card p-4 flex items-center gap-4 border-2 border-primary/30 touch-highlight"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <span className="flex-1 text-left font-medium">Admin Dashboard</span>
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
                  {profile?.age_verified ? 'Age Verified' : 'ID Verification'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.age_verified 
                    ? 'Your age has been verified (18+)'
                    : 'Verify your age to create or attend events'}
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

      {/* Sign Out */}
      {user && (
        <section className="px-4 mt-6 mb-4">
          <Button 
            variant="ghost" 
            className="w-full text-destructive hover:text-destructive gap-2 touch-target"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </section>
      )}
    </MobileLayout>
  );
};

export default Profile;
