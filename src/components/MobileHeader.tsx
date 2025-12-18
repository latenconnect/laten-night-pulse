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
      'px-4 py-3 flex items-center justify-between min-h-[56px]',
      !transparent && 'bg-background/80 backdrop-blur-xl',
      className
    )}>
      <div className="w-10 flex justify-start">
        {showBack && (
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full touch-target"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
      
      {title && (
        <h1 className="font-display font-semibold text-lg text-foreground flex-1 text-center">
          {title}
        </h1>
      )}
      
      <div className="flex justify-end items-center gap-1">
        {showLanguage && <LanguageSwitcher />}
        <DMInbox />
        {showSearch && searchContext && (
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={searchContext.openSearch}
              className="h-10 w-10 rounded-full touch-target"
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
