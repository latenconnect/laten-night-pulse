import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface SearchContextType {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const SearchContext = createContext<SearchContextType | null>(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const toggleSearch = useCallback(() => setIsSearchOpen(prev => !prev), []);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, toggleSearch, closeSearch]);

  return (
    <SearchContext.Provider value={{ isSearchOpen, openSearch, closeSearch, toggleSearch }}>
      {children}
    </SearchContext.Provider>
  );
};
