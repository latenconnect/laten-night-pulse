import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Calendar, MessageCircle, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface SocialActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
}

const SocialActivityFeed: React.FC<SocialActivityFeedProps> = ({ 
  limit = 4, 
  showHeader = true 
}) => {
  const { user } = useAuth();
  
  // No mock data - section remains hidden until real activity feed is implemented
  // This will show real friend activity when the backend supports it
  if (!user) {
    return null;
  }

  // Return null - no fake activity to display
  return null;
};

export default SocialActivityFeed;
