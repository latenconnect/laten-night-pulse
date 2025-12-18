import { motion } from 'framer-motion';
import { Music, Wine, Camera, Shield, Sparkles } from 'lucide-react';
import { ProfessionType, PROFESSION_LABELS } from '@/hooks/useProfessionals';
import { cn } from '@/lib/utils';

interface ProfessionFilterProps {
  selected: ProfessionType[];
  onChange: (types: ProfessionType[]) => void;
}

const professionConfig: Record<ProfessionType, { icon: typeof Music; gradient: string; shadow: string }> = {
  dj: { icon: Music, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
  bartender: { icon: Wine, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
  photographer: { icon: Camera, gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' },
  security: { icon: Shield, gradient: 'from-slate-500 to-zinc-600', shadow: 'shadow-slate-500/20' },
};

const professions: ProfessionType[] = ['dj', 'bartender', 'photographer', 'security'];

export const ProfessionFilter = ({ selected, onChange }: ProfessionFilterProps) => {
  const toggleProfession = (type: ProfessionType) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  const isAllSelected = selected.length === 0;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
      {/* All button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange([])}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all flex-shrink-0",
          isAllSelected
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : "bg-muted/50 text-muted-foreground hover:bg-muted"
        )}
      >
        <Sparkles className="h-4 w-4" />
        All
      </motion.button>

      {/* Profession buttons */}
      {professions.map((type) => {
        const config = professionConfig[type];
        const Icon = config.icon;
        const isSelected = selected.includes(type);

        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleProfession(type)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all flex-shrink-0",
              isSelected
                ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg ${config.shadow}`
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {PROFESSION_LABELS[type]}
          </motion.button>
        );
      })}
    </div>
  );
};
