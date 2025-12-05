import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchTriggerProps {
  onClick: () => void;
  variant?: 'icon' | 'bar';
  className?: string;
}

const SearchTrigger = ({ onClick, variant = 'icon', className = '' }: SearchTriggerProps) => {
  if (variant === 'bar') {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 w-full px-4 py-2.5 bg-muted/50 hover:bg-muted rounded-xl border border-border/50 transition-colors ${className}`}
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Search events, clubs...</span>
        <kbd className="hidden md:inline-flex ml-auto items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={className}
    >
      <Search className="w-5 h-5" />
    </Button>
  );
};

export default SearchTrigger;
