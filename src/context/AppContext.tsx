import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

const ONBOARDING_KEY = 'laten_onboarding_completed';
const CITY_KEY = 'laten_selected_city';
const INTERESTS_KEY = 'laten_interests';

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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem(CITY_KEY) || 'Budapest';
  });
  const [interests, setInterests] = useState<string[]>(() => {
    const saved = localStorage.getItem(INTERESTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage when values change
  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, hasCompletedOnboarding.toString());
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    localStorage.setItem(CITY_KEY, selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
  }, [interests]);

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
