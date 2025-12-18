import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Compass, Plus, Music, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useLanguage } from '@/context/LanguageContext';
import { useTotalUnreadCount } from '@/hooks/useDirectMessages';

const navItems = [
  { icon: Map, labelKey: 'nav.map', path: '/map' },
  { icon: Compass, labelKey: 'nav.explore', path: '/explore' },
  { icon: Plus, labelKey: 'host.createEvent', path: '/create', isSpecial: true },
  { icon: Music, labelKey: 'dj.browseDJs', path: '/djs' },
  { icon: User, labelKey: 'nav.profile', path: '/profile' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lightTap, mediumTap } = useHaptics();
  const { t } = useLanguage();
  const { data: unreadCount } = useTotalUnreadCount();

  const handleNavPress = async (path: string, isSpecial: boolean = false) => {
    if (isSpecial) {
      await mediumTap();
    } else {
      await lightTap();
    }
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-left safe-right">
      <div className="bg-gradient-to-t from-background via-background/95 to-transparent pt-4">
        <div className="glass-card mx-4 mb-2 safe-bottom-nav flex items-center justify-around p-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <motion.button
                  key={item.path}
                  onClick={() => handleNavPress(item.path, true)}
                  whileTap={{ scale: 0.9 }}
                  className="relative -mt-8 touch-target no-select"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-neon-pink to-secondary flex items-center justify-center shadow-[0_0_25px_hsla(270,91%,65%,0.5)] gpu-accelerated"
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
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 touch-target no-select relative',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                        style={{ boxShadow: '0 0 10px hsl(270 91% 65%)' }}
                      />
                    )}
                  </AnimatePresence>
                  {/* Unread badge */}
                  {showBadge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] bg-primary rounded-full text-[9px] font-bold flex items-center justify-center text-primary-foreground px-1 shadow-[0_0_8px_hsla(270,91%,65%,0.5)]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] transition-all",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {t(item.labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
