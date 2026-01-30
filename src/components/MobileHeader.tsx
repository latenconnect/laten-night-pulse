import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SearchContext } from '@/context/SearchContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { DMInbox } from '@/components/messaging';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  backPath?: string;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  className?: string;
  showSearch?: boolean;
  showLanguage?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  backPath,
  rightAction,
  transparent = false,
  className,
  showSearch = false,
  showLanguage = false
}) => {
  const navigate = useNavigate();
  const searchContext = useContext(SearchContext);

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn(
      'px-4 py-3 flex items-center justify-between min-h-[52px]',
      !transparent && 'bg-background/85 backdrop-blur-2xl border-b border-border/10',
      className
    )}>
      {/* Left section */}
      <div className="w-10 flex justify-start">
        {showBack && (
          <motion.div whileTap={{ scale: 0.92 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-full touch-target text-foreground/80 hover:text-foreground hover:bg-muted/50"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Center - Title */}
      {title && (
        <h1 className="font-semibold text-[17px] text-foreground flex-1 text-center tracking-tight">
          {title}
        </h1>
      )}
      
      {/* Right section */}
      <div className="flex justify-end items-center gap-0.5">
        {showLanguage && <LanguageSwitcher />}
        <DMInbox />
        {showSearch && searchContext && (
          <motion.div whileTap={{ scale: 0.92 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={searchContext.openSearch}
              className="h-9 w-9 rounded-full touch-target text-foreground/80 hover:text-foreground hover:bg-muted/50"
            >
              <Search className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
        {rightAction}
      </div>
    </div>
  );
};

export default MobileHeader;
