import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Calendar, MessageCircle, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'friend_joined' | 'event_rsvp' | 'story_posted' | 'new_follower' | 'friend_rsvp';
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  target?: {
    name: string;
    type: 'event' | 'story' | 'user';
  };
  timestamp: Date;
}

// Mock activity data - in production this would come from a hook
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'friend_rsvp',
    user: { id: '1', name: 'Alex', avatar: undefined },
    target: { name: 'Szimpla Friday Night', type: 'event' },
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: '2',
    type: 'story_posted',
    user: { id: '2', name: 'Maria', avatar: undefined },
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: '3',
    type: 'new_follower',
    user: { id: '3', name: 'Peter', avatar: undefined },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '4',
    type: 'event_rsvp',
    user: { id: '4', name: 'Sophie', avatar: undefined },
    target: { name: 'Akvárium Club Event', type: 'event' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
];

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'friend_rsvp':
    case 'event_rsvp':
      return <Calendar className="w-4 h-4 text-primary" />;
    case 'story_posted':
      return <MessageCircle className="w-4 h-4 text-secondary" />;
    case 'new_follower':
    case 'friend_joined':
      return <UserPlus className="w-4 h-4 text-cyan-400" />;
    default:
      return <Heart className="w-4 h-4 text-neon-pink" />;
  }
};

const getActivityText = (activity: ActivityItem) => {
  switch (activity.type) {
    case 'friend_rsvp':
      return (
        <>
          <span className="font-medium">{activity.user.name}</span>
          {' is going to '}
          <span className="text-primary">{activity.target?.name}</span>
        </>
      );
    case 'event_rsvp':
      return (
        <>
          <span className="font-medium">{activity.user.name}</span>
          {' joined '}
          <span className="text-primary">{activity.target?.name}</span>
        </>
      );
    case 'story_posted':
      return (
        <>
          <span className="font-medium">{activity.user.name}</span>
          {' posted a new story'}
        </>
      );
    case 'new_follower':
      return (
        <>
          <span className="font-medium">{activity.user.name}</span>
          {' started following you'}
        </>
      );
    case 'friend_joined':
      return (
        <>
          <span className="font-medium">{activity.user.name}</span>
          {' joined Laten'}
        </>
      );
    default:
      return null;
  }
};

interface SocialActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
}

const SocialActivityFeed: React.FC<SocialActivityFeedProps> = ({ 
  limit = 4, 
  showHeader = true 
}) => {
  const activities = mockActivities.slice(0, limit);

  if (activities.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display font-bold text-lg">Friend Activity</h2>
        </div>
      )}
      
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 hover:bg-card transition-colors cursor-pointer"
          >
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm">
                  {activity.user.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border border-border">
                {getActivityIcon(activity.type)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default SocialActivityFeed;
