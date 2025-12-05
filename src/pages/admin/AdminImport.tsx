import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Database, MapPin, RefreshCw, Download, DollarSign, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const HUNGARIAN_CITIES = [
  "Budapest", "Debrecen", "Szeged", "Pécs", "Győr", "Siófok", "Miskolc", "Eger",
  "Veszprém", "Székesfehérvár", "Sopron", "Nyíregyháza", "Kaposvár", "Balatonfüred",
  "Tokaj", "Kecskemét", "Dunaújváros", "Esztergom", "Hévíz", "Zamárdi"
];

interface CityStats {
  city: string;
  count: number;
  lastUpdated: string | null;
}

interface ImportResult {
  success: boolean;
  totalImported?: number;
  totalSkipped?: number;
  results?: Record<string, { imported: number; skipped: number }>;
  error?: string;
}

const AdminImport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [cityStats, setCityStats] = useState<CityStats[]>([]);
  const [totalClubs, setTotalClubs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [maxPerCity, setMaxPerCity] = useState<string>('50');
  const [importLog, setImportLog] = useState<string[]>([]);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupLog, setCleanupLog] = useState<string[]>([]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error || !data) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchStats();
    };

    checkAdminAccess();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      // Get total count
      const { count } = await supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true });
      
      setTotalClubs(count || 0);

      // Get per-city stats
      const stats: CityStats[] = [];
      for (const city of HUNGARIAN_CITIES) {
        const { count: cityCount, data } = await supabase
          .from('clubs')
          .select('last_updated', { count: 'exact' })
          .eq('city', city)
          .order('last_updated', { ascending: false })
          .limit(1);

        stats.push({
          city,
          count: cityCount || 0,
          lastUpdated: data?.[0]?.last_updated || null
        });
      }

      setCityStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportLog([]);
    
    const city = selectedCity === 'all' ? null : selectedCity;
    const maxPlaces = parseInt(maxPerCity);

    setImportLog(prev => [...prev, `Starting import${city ? ` for ${city}` : ' for all cities'}...`]);
    setImportLog(prev => [...prev, `Max venues per city: ${maxPlaces}`]);

    try {
      const response = await supabase.functions.invoke('import-clubs', {
        body: {
          city,
          maxPlacesPerCity: maxPlaces
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result: ImportResult = response.data;

      if (result.success) {
        setImportLog(prev => [...prev, `✓ Import completed!`]);
        setImportLog(prev => [...prev, `  Total imported: ${result.totalImported}`]);
        setImportLog(prev => [...prev, `  Total skipped (existing): ${result.totalSkipped}`]);

        if (result.results) {
          Object.entries(result.results).forEach(([cityName, stats]) => {
            setImportLog(prev => [...prev, `  ${cityName}: +${stats.imported} new, ${stats.skipped} existing`]);
          });
        }

        toast.success(`Import completed: ${result.totalImported} new venues added`);
        fetchStats();
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setImportLog(prev => [...prev, `✗ Error: ${message}`]);
      toast.error(`Import failed: ${message}`);
    } finally {
      setImporting(false);
    }
  };

  const estimateCost = () => {
    const maxPlaces = parseInt(maxPerCity);
    const cities = selectedCity === 'all' ? HUNGARIAN_CITIES.length : 1;
    // Rough estimate: ~3 API calls per venue (search + details + photo)
    // Google Places API: ~$0.032 per Nearby Search, ~$0.017 per Place Details
    const estimatedCalls = cities * maxPlaces * 0.1; // Conservative estimate
    const estimatedCost = estimatedCalls * 0.03;
    return estimatedCost.toFixed(2);
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanupLog([]);
    setCleanupLog(prev => [...prev, 'Starting venue cleanup and categorization...']);
    setCleanupLog(prev => [...prev, 'Removing non-club venues & categorizing nightlife spots...']);

    try {
      const response = await supabase.functions.invoke('cleanup-venues');

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.success) {
        setCleanupLog(prev => [...prev, `✓ Cleanup completed!`]);
        setCleanupLog(prev => [...prev, `  Deactivated: ${result.deactivated_count} non-club venues`]);
        setCleanupLog(prev => [...prev, `  Recategorized: ${result.recategorized_count} venues`]);
        
        if (result.deactivated_venues && result.deactivated_venues.length > 0) {
          setCleanupLog(prev => [...prev, `  Removed venues:`]);
          result.deactivated_venues.slice(0, 15).forEach((name: string) => {
            setCleanupLog(prev => [...prev, `    ✗ ${name}`]);
          });
          if (result.deactivated_venues.length > 15) {
            setCleanupLog(prev => [...prev, `    ... and ${result.deactivated_venues.length - 15} more`]);
          }
        }

        if (result.recategorized_venues && result.recategorized_venues.length > 0) {
          setCleanupLog(prev => [...prev, `  Recategorized venues:`]);
          result.recategorized_venues.slice(0, 15).forEach((change: string) => {
            setCleanupLog(prev => [...prev, `    → ${change}`]);
          });
          if (result.recategorized_venues.length > 15) {
            setCleanupLog(prev => [...prev, `    ... and ${result.recategorized_venues.length - 15} more`]);
          }
        }

        toast.success(`Cleanup: ${result.deactivated_count} removed, ${result.recategorized_count} recategorized`);
        fetchStats();
      } else {
        throw new Error(result.error || 'Cleanup failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setCleanupLog(prev => [...prev, `✗ Error: ${message}`]);
      toast.error(`Cleanup failed: ${message}`);
    } finally {
      setCleaning(false);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Club Database Import</h1>
          <p className="text-muted-foreground mt-1">Import venue data from Google Places API (New)</p>
        </div>

        {/* Cleanup Section */}
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-500 text-lg">
              <Trash2 className="h-5 w-5" />
              Database Cleanup
            </CardTitle>
            <CardDescription>
              Remove non-club venues (restaurants, cafes, shopping malls, theatres, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleCleanup} 
              disabled={cleaning}
              variant="destructive"
              className="gap-2"
            >
              {cleaning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Clean Non-Club Venues
                </>
              )}
            </Button>

            {/* Cleanup Log */}
            {cleanupLog.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg font-mono text-xs max-h-48 overflow-y-auto">
                {cleanupLog.map((log, i) => (
                  <div key={i} className="py-0.5">{log}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Warning */}
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-500 text-lg">
              <DollarSign className="h-5 w-5" />
              Cost Control Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• <strong>Monthly budget:</strong> $20-50 USD max</p>
            <p>• <strong>Import strategy:</strong> City-by-city to control spending</p>
            <p>• <strong>Update frequency:</strong> Only re-import every 30-90 days</p>
            <p>• <strong>User interactions:</strong> Always use cached data, never call Google API</p>
          </CardContent>
        </Card>

        {/* Import Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Import Controls
            </CardTitle>
            <CardDescription>
              Configure and trigger venue imports from Google Places API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target City</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities (Full Import)</SelectItem>
                    {HUNGARIAN_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Venues Per City</label>
                <Select value={maxPerCity} onValueChange={setMaxPerCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 (Test)</SelectItem>
                    <SelectItem value="50">50 (Light)</SelectItem>
                    <SelectItem value="100">100 (Standard)</SelectItem>
                    <SelectItem value="200">200 (Full)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Cost</label>
                <div className="h-10 px-3 flex items-center border rounded-md bg-muted/50">
                  <span className="text-muted-foreground">~${estimateCost()} USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button 
                onClick={handleImport} 
                disabled={importing}
                className="gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Start Import
                  </>
                )}
              </Button>

              {selectedCity === 'all' && (
                <Badge variant="outline" className="text-amber-500 border-amber-500">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Full import may cost ${(parseFloat(estimateCost()) * HUNGARIAN_CITIES.length / 2).toFixed(2)}+
                </Badge>
              )}
            </div>

            {/* Import Log */}
            {importLog.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg font-mono text-xs max-h-48 overflow-y-auto">
                {importLog.map((log, i) => (
                  <div key={i} className="py-0.5">{log}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Statistics
            </CardTitle>
            <CardDescription>
              Current venue data in local database (total: {totalClubs} clubs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {cityStats.map(stat => (
                  <div 
                    key={stat.city} 
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span className="font-medium text-sm truncate">{stat.city}</span>
                    </div>
                    <div className="text-2xl font-bold">{stat.count}</div>
                    {stat.lastUpdated && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(stat.lastUpdated).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchStats}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Stats
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Terms Reminder */}
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Google Places API (New) Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>✓ Using only searchNearby, Place Details, and Place Photos endpoints</p>
            <p>✓ Data cached locally - users never trigger Google API calls</p>
            <p>✓ Storing: name, coordinates, address, rating, price level, photos, Google Maps URI</p>
            <p>✓ Venue types: bar, night_club, restaurant</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminImport;
