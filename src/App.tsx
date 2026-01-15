import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import CookieConsent from "@/components/CookieConsent";
import NotificationPrompt from "@/components/NotificationPrompt";
import GlobalSearch from "@/components/GlobalSearch";
import DeepLinkHandler from "@/components/DeepLinkHandler";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import MapView from "./pages/MapView";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import SavedEvents from "./pages/SavedEvents";
import CreateEvent from "./pages/CreateEvent";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import ClubDetails from "./pages/ClubDetails";
import Friends from "./pages/Friends";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReports from "./pages/admin/AdminReports";
import AdminHosts from "./pages/admin/AdminHosts";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminImport from "./pages/admin/AdminImport";
import AdminDJs from "./pages/admin/AdminDJs";
import AdminBartenders from "./pages/admin/AdminBartenders";
import AdminTranslations from "./pages/admin/AdminTranslations";
import DJMarketplace from "./pages/DJMarketplace";
import DJProfile from "./pages/DJProfile";
import DJDashboard from "./pages/DJDashboard";
import BartenderMarketplace from "./pages/BartenderMarketplace";
import BartenderProfile from "./pages/BartenderProfile";
import BartenderDashboard from "./pages/BartenderDashboard";
import Professionals from "./pages/Professionals";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancelled from "./pages/SubscriptionCancelled";
import GroupDetails from "./pages/GroupDetails";
import { SearchContext } from "@/context/SearchContext";
import { LanguageProvider } from "@/context/LanguageContext";

const queryClient = new QueryClient();

// queryClient is defined above

const AppContent = () => {
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
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/club/:id" element={<ClubDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/groups/:groupId" element={<GroupDetails />} />
        <Route path="/saved" element={<SavedEvents />} />
        <Route path="/create" element={<CreateEvent />} />
        {/* Professionals Marketplace routes */}
        <Route path="/professionals" element={<Professionals />} />
        <Route path="/professional/:professionalId" element={<ProfessionalProfile />} />
        <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
        {/* Legacy DJ routes - redirect to professionals */}
        <Route path="/djs" element={<DJMarketplace />} />
        <Route path="/dj/:djId" element={<DJProfile />} />
        <Route path="/dj/dashboard" element={<DJDashboard />} />
        {/* Legacy Bartender routes - redirect to professionals */}
        <Route path="/bartenders" element={<BartenderMarketplace />} />
        <Route path="/bartender/:bartenderId" element={<BartenderProfile />} />
        <Route path="/bartender/dashboard" element={<BartenderDashboard />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/support" element={<Support />} />
        {/* Subscription routes */}
        <Route path="/subscription/success" element={<SubscriptionSuccess />} />
        <Route path="/subscription/cancelled" element={<SubscriptionCancelled />} />
        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/hosts" element={<AdminHosts />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/djs" element={<AdminDJs />} />
        <Route path="/admin/bartenders" element={<AdminBartenders />} />
        <Route path="/admin/import" element={<AdminImport />} />
        <Route path="/admin/translations" element={<AdminTranslations />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      <CookieConsent />
      <NotificationPrompt />
    </SearchContext.Provider>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for splash screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner 
                position="top-center"
                toastOptions={{
                  style: {
                    background: 'hsl(240 15% 10%)',
                    border: '1px solid hsl(240 15% 18%)',
                    color: 'hsl(0 0% 98%)',
                  },
                }}
              />
              <AnimatePresence mode="wait">
                {isLoading && <SplashScreen key="splash" />}
              </AnimatePresence>
              <BrowserRouter>
                <DeepLinkHandler />
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </AppProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
