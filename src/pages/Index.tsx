import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

const Index: React.FC = () => {
  const { hasCompletedOnboarding } = useApp();

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/explore" replace />;
};

export default Index;
