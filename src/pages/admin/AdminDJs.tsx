import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Music, MapPin, Star, Crown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DJProfile {
  id: string;
  user_id: string;
  dj_name: string;
  city: string;
  genres: string[];
  rating: number | null;
  review_count: number | null;
  is_active: boolean | null;
  created_at: string | null;
  profile_photo: string | null;
  subscription?: {
    status: string;
    expires_at: string | null;
  } | null;
}

const AdminDJs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [djs, setDJs] = useState<DJProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!data) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
    };

    checkAccess();
  }, [user, navigate]);

  const fetchDJs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('dj_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data: djData, error } = await query;
      if (error) throw error;

      // Fetch subscriptions separately
      const djIds = (djData || []).map(d => d.id);
      const { data: subscriptions } = await supabase
        .from('dj_subscriptions')
        .select('*')
        .in('dj_profile_id', djIds);

      const subMap = new Map(subscriptions?.map(s => [s.dj_profile_id, s]) || []);

      const djsWithSubs = (djData || []).map(dj => ({
        ...dj,
        subscription: subMap.get(dj.id) || null
      }));

      setDJs(djsWithSubs);
    } catch (error) {
      console.error('Error fetching DJs:', error);
      toast.error('Failed to load DJs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDJs();
    }
  }, [filter, isAdmin]);

  const toggleSubscription = async (djId: string, currentStatus: string | undefined) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const expiresAt = newStatus === 'active' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        : null;

      const { data: existing } = await supabase
        .from('dj_subscriptions')
        .select('id')
        .eq('dj_profile_id', djId)
        .single();

      if (existing) {
        await supabase
          .from('dj_subscriptions')
          .update({ status: newStatus, expires_at: expiresAt })
          .eq('dj_profile_id', djId);
      } else {
        await supabase
          .from('dj_subscriptions')
          .insert({
            dj_profile_id: djId,
            status: newStatus,
            expires_at: expiresAt,
            tier: 'basic',
            price_cents: 400000,
            currency: 'HUF'
          });
      }

      toast.success(`Subscription ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchDJs();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const toggleActive = async (djId: string, isActive: boolean) => {
    try {
      await supabase
        .from('dj_profiles')
        .update({ is_active: !isActive })
        .eq('id', djId);

      toast.success(`DJ profile ${!isActive ? 'activated' : 'deactivated'}`);
      fetchDJs();
    } catch (error) {
      console.error('Error toggling DJ status:', error);
      toast.error('Failed to update DJ status');
    }
  };

  const deleteDJ = async (djId: string) => {
    if (!confirm('Are you sure you want to delete this DJ profile?')) return;

    try {
      await supabase.from('dj_subscriptions').delete().eq('dj_profile_id', djId);
      await supabase.from('dj_availability').delete().eq('dj_profile_id', djId);
      await supabase.from('dj_booking_requests').delete().eq('dj_profile_id', djId);
      await supabase.from('dj_reviews').delete().eq('dj_profile_id', djId);
      await supabase.from('dj_profiles').delete().eq('id', djId);

      toast.success('DJ profile deleted');
      fetchDJs();
    } catch (error) {
      console.error('Error deleting DJ:', error);
      toast.error('Failed to delete DJ');
    }
  };

  const getSubscriptionBadge = (subscription: DJProfile['subscription']) => {
    if (!subscription || subscription.status !== 'active') {
      return <Badge variant="secondary">No Subscription</Badge>;
    }
    const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date();
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge className="bg-primary/20 text-primary border-0">Active</Badge>;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">DJ Management</h1>
            <p className="text-muted-foreground mt-1">Manage DJ profiles and subscriptions</p>
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48" />
              </Card>
            ))}
          </div>
        ) : djs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No {filter !== 'all' ? filter : ''} DJ profiles found
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {djs.map((dj) => (
              <Card key={dj.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={dj.profile_photo || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {dj.dj_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{dj.dj_name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {dj.city}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getSubscriptionBadge(dj.subscription)}
                      <Badge variant={dj.is_active ? 'default' : 'secondary'}>
                        {dj.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {dj.genres.slice(0, 3).map((genre) => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          <Music className="h-2.5 w-2.5 mr-1" />
                          {genre}
                        </Badge>
                      ))}
                      {dj.genres.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{dj.genres.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {(dj.rating || 0).toFixed(1)} ({dj.review_count || 0})
                      </span>
                      {dj.created_at && (
                        <span>
                          Joined: {format(new Date(dj.created_at), 'PP')}
                        </span>
                      )}
                    </div>

                    {dj.subscription?.expires_at && dj.subscription.status === 'active' && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {format(new Date(dj.subscription.expires_at), 'PPP')}
                      </p>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant={dj.subscription?.status === 'active' ? 'destructive' : 'default'}
                        className="flex-1"
                        onClick={() => toggleSubscription(dj.id, dj.subscription?.status)}
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        {dj.subscription?.status === 'active' ? 'Revoke Sub' : 'Grant Sub'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(dj.id, dj.is_active || false)}
                      >
                        {dj.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteDJ(dj.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDJs;
