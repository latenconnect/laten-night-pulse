import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Explore from "./pages/Explore";
import MapView from "./pages/MapView";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import SavedEvents from "./pages/SavedEvents";
import CreateEvent from "./pages/CreateEvent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/saved" element={<SavedEvents />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
