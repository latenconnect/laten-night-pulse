import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Compass, Plus, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Map, label: 'Map', path: '/map' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Plus, label: 'Create', path: '/create', isSpecial: true },
  { icon: Heart, label: 'Saved', path: '/saved' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-left safe-right">
      <div className="bg-gradient-to-t from-background via-background/95 to-transparent pt-4">
        <div className="glass-card mx-4 mb-2 safe-bottom-nav flex items-center justify-around p-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  whileTap={{ scale: 0.9 }}
                  className="relative -mt-8 touch-target no-select"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-neon-pink to-secondary flex items-center justify-center shadow-[0_0_25px_hsla(270,91%,65%,0.5)] gpu-accelerated">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors touch-target no-select',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                      style={{ boxShadow: '0 0 10px hsl(270 91% 65%)' }}
                    />
                  )}
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
