import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wine, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileLayout from '@/components/layouts/MobileLayout';
import { BartenderCard } from '@/components/bartender/BartenderCard';
import { BartenderFilters } from '@/components/bartender/BartenderFilters';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useBartenders, BartenderFilters as BartenderFiltersType, useMyBartenderProfile } from '@/hooks/useBartenders';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const BartenderMarketplace = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { selectedCity } = useApp();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<BartenderFiltersType>({ city: selectedCity });
  
  const { bartenders, isLoading } = useBartenders(filters);
  const { data: myProfile } = useMyBartenderProfile();

  const filteredBartenders = bartenders.filter(bartender => 
    bartender.bartender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bartender.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wine className="h-6 w-6 text-amber-500" />
              <h1 className="text-xl font-bold text-foreground">{t('bartenderMarketplace')}</h1>
            </div>
            {user && (
              <Button 
                size="sm" 
                onClick={() => navigate('/bartender/dashboard')}
                className="gap-1 bg-amber-500 hover:bg-amber-600 text-black"
              >
                <Plus className="h-4 w-4" />
                {myProfile ? t('bartenderDashboard') : t('becomeBartender')}
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchBartenders')}
              className="pl-10 bg-muted/50 border-border/50"
            />
          </div>

          {/* Filters */}
          <BartenderFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Content */}
        <div className="p-4">
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="browse" className="flex-1">{t('browseBartenders')}</TabsTrigger>
              <TabsTrigger value="tonight" className="flex-1">{t('availableTonight')}</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-3">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))
              ) : filteredBartenders.length > 0 ? (
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {filteredBartenders.map((bartender, index) => (
                    <motion.div
                      key={bartender.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <BartenderCard bartender={bartender} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <Wine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground mb-2">{t('noBartendersFound')}</h3>
                  <p className="text-sm text-muted-foreground">{t('tryDifferentFilters')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tonight" className="space-y-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Wine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">{t('checkBackLater')}</h3>
                <p className="text-sm text-muted-foreground">{t('bartendersUpdateAvailability')}</p>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
};

export default BartenderMarketplace;
