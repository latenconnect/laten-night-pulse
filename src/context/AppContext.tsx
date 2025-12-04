import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  interests: string[];
  setInterests: (interests: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Budapest');
  const [interests, setInterests] = useState<string[]>([]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        selectedCity,
        setSelectedCity,
        interests,
        setInterests,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
