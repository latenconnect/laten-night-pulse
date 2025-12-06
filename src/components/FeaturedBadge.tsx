import React from 'react';
import { Star, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedBadgeProps {
  variant?: 'default' | 'premium' | 'sponsored';
  size?: 'sm' | 'md';
  className?: string;
}

const FeaturedBadge: React.FC<FeaturedBadgeProps> = ({ 
  variant = 'default', 
  size = 'sm',
  className 
}) => {
  const variants = {
    default: {
      bg: 'bg-primary/90 backdrop-blur-sm',
      text: 'Featured',
      icon: Star,
    },
    premium: {
      bg: 'bg-gradient-to-r from-amber-500 to-yellow-400 backdrop-blur-sm',
      text: 'Premium',
      icon: Crown,
    },
    sponsored: {
      bg: 'bg-gradient-to-r from-secondary to-cyan-400 backdrop-blur-sm',
      text: 'Promoted',
      icon: Sparkles,
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const { bg, text, icon: Icon } = variants[variant];

  return (
    <div className={cn(
      'flex items-center gap-1 rounded-full font-semibold',
      bg,
      sizes[size],
      className
    )}>
      <Icon className={cn('fill-current', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      <span>{text}</span>
    </div>
  );
};

export default FeaturedBadge;