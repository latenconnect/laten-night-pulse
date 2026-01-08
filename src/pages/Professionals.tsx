import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Sparkles, TrendingUp, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MobileLayout from '@/components/layouts/MobileLayout';
import { ProfessionalCard } from '@/components/professionals/ProfessionalCard';
import { ProfessionFilter } from '@/components/professionals/ProfessionFilter';
import { ProfessionalFilters } from '@/components/professionals/ProfessionalFilters';
import { NativeAdCard } from '@/components/ads';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { 
  useProfessionals, 
  useMyProfessionalProfiles,
  ProfessionalFilters as FiltersType, 
  ProfessionType,
  PROFESSION_LABELS 
} from '@/hooks/useProfessionals';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const Professionals = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { selectedCity } = useApp();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfessions, setSelectedProfessions] = useState<ProfessionType[]>([]);
  const [filters, setFilters] = useState<FiltersType>({ city: selectedCity });
  const [activeTab, setActiveTab] = useState<'discover' | 'trending'>('discover');
  
  // Combine profession filter with other filters
  const combinedFilters: FiltersType = {
    ...filters,
    professionTypes: selectedProfessions.length > 0 ? selectedProfessions : undefined,
  };
  
  const { data: professionals = [], isLoading } = useProfessionals(combinedFilters);
  const { data: myProfiles = [] } = useMyProfessionalProfiles();

  // Filter by search query
  const filteredProfessionals = professionals.filter(pro => 
    pro.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pro.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
    pro.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
    PROFESSION_LABELS[pro.profession_type].toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by rating for trending
  const trendingProfessionals = [...filteredProfessionals].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const displayProfessionals = activeTab === 'trending' ? trendingProfessionals : filteredProfessionals;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="px-4 pt-4 pb-3">
            {/* Title Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">
                    Find Professionals
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {selectedCity || 'All cities'}
                  </p>
                </div>
              </div>
              {user && (
                <Button 
                  size="sm" 
                  onClick={() => navigate('/professional/dashboard')}
                  className="gap-1.5 rounded-full shadow-lg shadow-primary/20"
                >
                  <Plus className="h-4 w-4" />
                  {myProfiles.length > 0 ? 'Dashboard' : 'Join'}
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, skill, or profession..."
                  className="pl-11 h-12 bg-card/60 backdrop-blur-sm border-border/30 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {/* Profession Filter */}
            <div className="mb-3">
              <ProfessionFilter 
                selected={selectedProfessions} 
                onChange={setSelectedProfessions} 
              />
            </div>

            {/* Additional Filters */}
            <ProfessionalFilters 
              filters={filters} 
              onFiltersChange={setFilters}
              selectedProfessions={selectedProfessions}
            />
          </div>

          {/* Tabs */}
          <div className="px-4 pb-3">
            <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
              <button
                onClick={() => setActiveTab('discover')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'discover'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-4 w-4" />
                For You
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'trending'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                Top Rated
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-24">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-card/50 rounded-2xl">
                    <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : displayProfessionals.length > 0 ? (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {displayProfessionals.map((professional, index) => (
                  <React.Fragment key={professional.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <ProfessionalCard professional={professional} />
                    </motion.div>
                    {/* Show ad after every 5th professional */}
                    {index > 0 && (index + 1) % 5 === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (index + 1) * 0.05, duration: 0.3 }}
                      >
                        <NativeAdCard variant="professional" />
                      </motion.div>
                    )}
                  </React.Fragment>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                {/* Animated empty state */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-muted rounded-full flex items-center justify-center">
                    <Briefcase className="h-10 w-10 text-primary/60" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  No professionals found
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Try adjusting your filters or search for different skills
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedProfessions([]);
                    setFilters({});
                  }}
                  className="rounded-full"
                >
                  Clear filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Professionals;
