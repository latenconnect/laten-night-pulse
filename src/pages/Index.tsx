import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import SplashScreen from '@/components/SplashScreen';

const Index: React.FC = () => {
  const { hasCompletedOnboarding } = useApp();
  const { user, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return <SplashScreen />;
  }

  // Must authenticate first
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Then complete onboarding
  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/explore" replace />;
};

export default Index;
