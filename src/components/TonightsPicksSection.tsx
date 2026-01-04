import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ChevronRight } from 'lucide-react';
import { useTonightsPicks } from '@/hooks/useTonightsPicks';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { format } from 'date-fns';

const TonightsPicksSection: React.FC = () => {
  const { events, loading } = useTonightsPicks();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (loading || events.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Tonight's Picks</h2>
            <p className="text-xs text-muted-foreground">Curated just for you</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Live now</span>
        </div>
      </div>

      {/* Events Grid */}
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
        {events.slice(0, 5).map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/event/${event.id}`)}
            className="flex-shrink-0 w-44 cursor-pointer group"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-2">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: event.cover_image
                    ? `url(${event.cover_image})`
                    : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
                }}
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Tonight badge */}
              <div className="absolute top-2 left-2">
                <div className="px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Tonight
                </div>
              </div>

              {/* Time */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                <span className="text-white text-xs font-medium">
                  {format(new Date(event.start_time), 'HH:mm')}
                </span>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-bold line-clamp-2 mb-1">
                  {event.name}
                </p>
                <p className="text-white/70 text-xs line-clamp-1">
                  {event.location_name}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* View All Card */}
        {events.length > 5 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/explore')}
            className="flex-shrink-0 w-32 aspect-[4/5] rounded-2xl bg-card/50 border border-border/50 flex flex-col items-center justify-center cursor-pointer hover:bg-card/80 transition-colors"
          >
            <div className="p-3 rounded-full bg-primary/10 mb-2">
              <ChevronRight className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">
              +{events.length - 5} more
            </span>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default TonightsPicksSection;
