import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Calendar, MessageCircle, UserPlus, Bookmark, PartyPopper } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useFriendActivity, FriendActivity } from '@/hooks/useFriendActivity';
import { useNavigate } from 'react-router-dom';

interface SocialActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
}

const getActivityIcon = (type: FriendActivity['activity_type']) => {
  switch (type) {
    case 'rsvp':
      return <PartyPopper className="w-3 h-3 text-primary" />;
    case 'save':
      return <Bookmark className="w-3 h-3 text-amber-400" />;
    case 'attend':
      return <Calendar className="w-3 h-3 text-green-400" />;
    case 'host':
      return <Users className="w-3 h-3 text-cyan-400" />;
    case 'review':
      return <Heart className="w-3 h-3 text-pink-400" />;
    default:
      return <MessageCircle className="w-3 h-3 text-muted-foreground" />;
  }
};

const getActivityText = (type: FriendActivity['activity_type'], eventName?: string) => {
  switch (type) {
    case 'rsvp':
      return `is going to ${eventName || 'an event'}`;
    case 'save':
      return `saved ${eventName || 'an event'}`;
    case 'attend':
      return `attended ${eventName || 'an event'}`;
    case 'host':
      return `is hosting ${eventName || 'an event'}`;
    case 'review':
      return `reviewed ${eventName || 'an event'}`;
    default:
      return 'did something';
  }
};

const SocialActivityFeed: React.FC<SocialActivityFeedProps> = ({ 
  limit = 4, 
  showHeader = true 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activities, loading } = useFriendActivity(limit);
  
  if (!user) return null;
  if (loading) return null;
  if (activities.length === 0) return null;

  return (
    <section className="mb-6">
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-lg">Friend Activity</h2>
        </div>
      )}

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => activity.event_id && navigate(`/event/${activity.event_id}`)}
            className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border border-border/50 cursor-pointer hover:bg-card/80 transition-colors"
          >
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-background">
                <AvatarImage src={activity.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {activity.profile?.display_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background">
                {getActivityIcon(activity.activity_type)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium text-foreground">
                  {activity.profile?.display_name || 'Someone'}
                </span>{' '}
                <span className="text-muted-foreground">
                  {getActivityText(activity.activity_type, activity.event?.name)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Event thumbnail */}
            {activity.event?.cover_image && (
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                <img
                  src={activity.event.cover_image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default SocialActivityFeed;
