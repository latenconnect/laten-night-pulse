import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Compass, Plus, Briefcase, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useLanguage } from '@/context/LanguageContext';
import { useTotalUnreadCount } from '@/hooks/useDirectMessages';

const navItems = [
  { icon: Map, labelKey: 'nav.map', path: '/map' },
  { icon: Compass, labelKey: 'nav.explore', path: '/explore' },
  { icon: Plus, labelKey: 'host.createEvent', path: '/create', isSpecial: true },
  { icon: Briefcase, labelKey: 'nav.professionals', path: '/professionals' },
  { icon: User, labelKey: 'nav.profile', path: '/profile' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lightTap, mediumTap, selectionChanged } = useHaptics();
  const { t } = useLanguage();
  const { data: unreadCount } = useTotalUnreadCount();

  const handleNavPress = useCallback(async (path: string, isSpecial: boolean = false) => {
    if (location.pathname === path) {
      await selectionChanged();
      return;
    }
    
    if (isSpecial) {
      await mediumTap();
    } else {
      await lightTap();
    }
    navigate(path);
  }, [location.pathname, navigate, lightTap, mediumTap, selectionChanged]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-left safe-right">
      {/* Gradient fade for content behind */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
      
      <div className="bg-background/85 backdrop-blur-2xl border-t border-border/20 safe-bottom-nav">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <motion.button
                  key={item.path}
                  onClick={() => handleNavPress(item.path, true)}
                  whileTap={{ scale: 0.92 }}
                  className="relative -mt-5 touch-target no-select"
                  aria-label={t(item.labelKey)}
                >
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-neon-pink to-secondary flex items-center justify-center gpu-accelerated"
                    animate={{
                      boxShadow: isActive 
                        ? '0 0 28px hsla(270, 91%, 65%, 0.6), 0 4px 12px hsla(0, 0%, 0%, 0.3)'
                        : '0 0 20px hsla(270, 91%, 65%, 0.35), 0 4px 12px hsla(0, 0%, 0%, 0.2)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                </motion.button>
              );
            }

            const showBadge = item.path === '/profile' && unreadCount && unreadCount > 0;

            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavPress(item.path)}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors duration-150 touch-target no-select relative min-w-[56px]',
                  isActive ? 'text-primary' : 'text-muted-foreground/70'
                )}
                aria-label={t(item.labelKey)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.08 : 1,
                      y: isActive ? -1 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  >
                    <Icon className={cn("w-[22px] h-[22px]", isActive && "stroke-[2.5px]")} />
                  </motion.div>
                  
                  {/* Unread badge */}
                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-primary rounded-full text-[9px] font-bold flex items-center justify-center text-primary-foreground px-1 shadow-lg shadow-primary/40"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                
                <motion.span
                  className="text-[11px] font-medium leading-tight"
                  animate={{
                    fontWeight: isActive ? 600 : 500,
                    opacity: isActive ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {t(item.labelKey)}
                </motion.span>
                
                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_hsla(270,91%,65%,0.7)]"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
