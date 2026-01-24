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
    // Don't navigate if already on the same page
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
      {/* Gradient fade effect for content behind */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      <div className="bg-background/80 backdrop-blur-xl border-t border-border/30 safe-bottom-nav">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <motion.button
                  key={item.path}
                  onClick={() => handleNavPress(item.path, true)}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative -mt-6 touch-target no-select"
                  aria-label={t(item.labelKey)}
                >
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-neon-pink to-secondary flex items-center justify-center shadow-[0_0_25px_hsla(270,91%,65%,0.5)] gpu-accelerated"
                    animate={{
                      boxShadow: isActive 
                        ? '0 0 30px hsla(270, 91%, 65%, 0.7)'
                        : '0 0 20px hsla(270, 91%, 65%, 0.4)',
                    }}
                  >
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </motion.div>
                </motion.button>
              );
            }

            // Show badge on profile for unread messages
            const showBadge = item.path === '/profile' && unreadCount && unreadCount > 0;

            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavPress(item.path)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors duration-200 touch-target no-select relative min-w-[60px]',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-label={t(item.labelKey)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  
                  {/* Unread badge */}
                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-primary rounded-full text-[10px] font-bold flex items-center justify-center text-primary-foreground px-1 shadow-[0_0_8px_hsla(270,91%,65%,0.5)]"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                
                <motion.span
                  className="text-[11px] font-medium"
                  animate={{
                    fontWeight: isActive ? 600 : 500,
                    opacity: isActive ? 1 : 0.8,
                  }}
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
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_hsla(270,91%,65%,0.8)]"
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
