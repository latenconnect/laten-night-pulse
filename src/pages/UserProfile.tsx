import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, User as UserIcon, Check, UserPlus, UserMinus, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileLayout from '@/components/layouts/MobileLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useLanguage } from '@/context/LanguageContext';

interface UserProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  is_verified: boolean | null;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { following, followUser, unfollowUser } = useFriends();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isFollowing = following.some(f => f.id === userId);
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, bio, city, is_verified')
      .eq('id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!userId || !user) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    // Navigate to DMs - could be implemented later
    navigate('/friends');
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!profile) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <UserIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">This profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg truncate">
            {profile.display_name || 'User'}
          </h1>
        </div>
      </header>

      {/* Profile Content */}
      <section className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-neon-pink to-secondary p-[3px] mb-4">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Name with verified badge */}
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-xl font-bold">{profile.display_name || 'Anonymous'}</h2>
            {profile.is_verified && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500">
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
          </div>

          {/* City */}
          {profile.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
              <MapPin className="w-3 h-3" />
              {profile.city}
            </p>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground max-w-xs mb-6">{profile.bio}</p>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && user && (
            <div className="flex gap-3">
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                onClick={handleFollow}
                disabled={followLoading}
                className="min-w-[120px]"
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <Button variant="outline" onClick={() => navigate('/profile')}>
              Edit Profile
            </Button>
          )}
        </motion.div>
      </section>
    </MobileLayout>
  );
};

export default UserProfile;
