import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Ticket, Flame, TrendingUp, Zap } from 'lucide-react';
import { Event, EVENT_TYPES } from '@/types';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import FeaturedBadge from './FeaturedBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FriendGoing {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface EventCardProps {
  event: Event & { hostHasBoost?: boolean };
  variant?: 'default' | 'compact' | 'featured';
  onClick?: () => void;
  friendsGoing?: FriendGoing[];
  isTrending?: boolean;
  isFillingFast?: boolean;
}

// FOMO Badge component
const FOMOBadge: React.FC<{
  type: 'friends' | 'trending' | 'filling-fast' | 'starting-soon' | 'hot';
  count?: number;
  friendAvatars?: string[];
}> = ({ type, count, friendAvatars = [] }) => {
  const configs = {
    friends: {
      icon: Users,
      label: `${count} friends going`,
      className: 'bg-primary/20 border-primary/40 text-primary',
    },
    trending: {
      icon: TrendingUp,
      label: 'Trending',
      className: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
    },
    'filling-fast': {
      icon: Zap,
      label: 'Filling fast',
      className: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    },
    'starting-soon': {
      icon: Clock,
      label: 'Starting soon',
      className: 'bg-green-500/20 border-green-500/40 text-green-400',
    },
    hot: {
      icon: Flame,
      label: 'Hot',
      className: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold backdrop-blur-md',
        config.className
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      {type === 'friends' && friendAvatars.length > 0 && (
        <div className="flex -space-x-1.5 ml-0.5">
          {friendAvatars.slice(0, 3).map((avatar, i) => (
            <img
              key={i}
              src={avatar}
              alt=""
              className="w-4 h-4 rounded-full border border-background object-cover"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  variant = 'default', 
  onClick,
  friendsGoing = [],
  isTrending = false,
  isFillingFast = false,
}) => {
  const eventType = EVENT_TYPES.find(t => t.id === event.type);
  const attendancePercentage = Math.round((event.currentRSVP / event.expectedAttendance) * 100);
  
  // Calculate FOMO signals
  const hoursUntilStart = differenceInHours(event.startTime, new Date());
  const isStartingSoon = hoursUntilStart > 0 && hoursUntilStart <= 4;
  const isHot = attendancePercentage >= 80;
  const hasFriendsGoing = friendsGoing.length > 0;

  if (variant === 'compact') {
    return (
      <motion.div
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className="glass-card p-3.5 cursor-pointer flex gap-3.5 transition-all duration-200 hover:border-primary/30 active:scale-[0.98]"
      >
        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
          {hasFriendsGoing && (
            <div className="absolute -bottom-1 -right-1 flex -space-x-1.5">
              {friendsGoing.slice(0, 2).map((friend, i) => (
                <Avatar key={friend.id} className="w-5 h-5 border-2 border-card">
                  <AvatarImage src={friend.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                    {friend.display_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {friendsGoing.length > 2 && (
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center border-2 border-card font-bold">
                  +{friendsGoing.length - 2}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm">{eventType?.icon}</span>
            <span className="text-[11px] text-muted-foreground font-medium">{event.location.city}</span>
            {isStartingSoon && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                Soon
              </span>
            )}
          </div>
          <h4 className="font-semibold text-[15px] truncate leading-snug mb-0.5">{event.name}</h4>
          <p className="text-[13px] text-muted-foreground">{format(event.startTime, 'EEE, MMM d • h:mm a')}</p>
        </div>
        <div className="flex flex-col items-end justify-center gap-1">
          <span className="text-primary font-semibold text-[13px]">
            {event.price ? `${event.price} Ft` : 'Free'}
          </span>
          {isHot && <Flame className="w-4 h-4 text-orange-500 animate-pulse" />}
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className="relative w-72 h-[380px] rounded-3xl overflow-hidden cursor-pointer flex-shrink-0 group"
      >
        <img src={event.coverImage} alt={event.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="flex flex-col gap-2">
            {(event.hostHasBoost || event.isFeatured) && (
              <FeaturedBadge 
                variant={event.hostHasBoost ? 'boosted' : 'default'} 
                size="sm" 
              />
            )}
            {hasFriendsGoing && (
              <FOMOBadge 
                type="friends" 
                count={friendsGoing.length} 
                friendAvatars={friendsGoing.map(f => f.avatar_url || '')}
              />
            )}
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            {isTrending && <FOMOBadge type="trending" />}
            {isFillingFast && <FOMOBadge type="filling-fast" />}
            {isHot && !isFillingFast && <FOMOBadge type="hot" />}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-lg">{eventType?.icon}</span>
            <span className="text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full backdrop-blur-md font-medium">
              {eventType?.label}
            </span>
            {isStartingSoon && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 font-medium animate-pulse">
                Starting soon
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-xl mb-2.5 neon-text leading-tight">{event.name}</h3>
          
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-3.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.location.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px] font-medium">{format(event.startTime, 'EEE, h:mm a')}</span>
            </div>
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
              isHot 
                ? 'bg-orange-500/20 border-orange-500/40' 
                : 'bg-primary/20 border-primary/40'
            )}>
              {isHot ? (
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              ) : (
                <Users className="w-3.5 h-3.5 text-primary" />
              )}
              <span className={cn(
                'text-[12px] font-semibold',
                isHot ? 'text-orange-400' : 'text-primary'
              )}>
                {event.currentRSVP}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="glass-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/30 group"
    >
      <div className="relative h-40">
        <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {event.hostHasBoost ? (
            <FeaturedBadge variant="boosted" size="sm" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-base">{eventType?.icon}</span>
              <span className="text-[11px] bg-card/80 backdrop-blur-md px-2.5 py-1 rounded-full font-medium">
                {eventType?.label}
              </span>
            </div>
          )}
          {hasFriendsGoing && (
            <FOMOBadge 
              type="friends" 
              count={friendsGoing.length} 
              friendAvatars={friendsGoing.map(f => f.avatar_url || '')}
            />
          )}
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          <span className={cn(
            "px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md",
            event.price ? "bg-primary/90 text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}>
            {event.price ? `${event.price} Ft` : 'Free Entry'}
          </span>
          {isTrending && <FOMOBadge type="trending" />}
          {isStartingSoon && <FOMOBadge type="starting-soon" />}
        </div>

        {event.isVerified && (
          <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-secondary flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-secondary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-[17px] mb-1.5 leading-snug">{event.name}</h3>
        
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{event.location.name}, {event.location.city}</span>
        </div>

        <div className="flex items-center gap-4 text-[13px] mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{format(event.startTime, 'EEE, MMM d')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-muted-foreground" />
            <span>{event.ageLimit}+</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {event.hostAvatar && (
              <img src={event.hostAvatar} alt={event.hostName} className="w-6 h-6 rounded-full ring-2 ring-background" />
            )}
            <span className="text-[13px] text-muted-foreground font-medium">{event.hostName}</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-16 h-1.5 rounded-full overflow-hidden',
              isHot ? 'bg-orange-500/20' : 'bg-muted/60'
            )}>
              <div 
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isHot 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                    : 'bg-gradient-to-r from-primary to-secondary'
                )}
                style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
              />
            </div>
            <span className={cn(
              'text-[11px] font-medium',
              isHot ? 'text-orange-400' : 'text-muted-foreground'
            )}>
              {event.currentRSVP}
            </span>
            {isHot && <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
