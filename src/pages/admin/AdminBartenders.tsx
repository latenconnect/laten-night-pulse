import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Wine, MapPin, Star, Crown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BartenderProfile {
  id: string;
  user_id: string;
  bartender_name: string;
  city: string;
  skills: string[];
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

const AdminBartenders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [bartenders, setBartenders] = useState<BartenderProfile[]>([]);
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

  const fetchBartenders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bartender_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data: bartenderData, error } = await query;
      if (error) throw error;

      // Fetch subscriptions separately
      const bartenderIds = (bartenderData || []).map(b => b.id);
      const { data: subscriptions } = await supabase
        .from('bartender_subscriptions')
        .select('*')
        .in('bartender_profile_id', bartenderIds);

      const subMap = new Map(subscriptions?.map(s => [s.bartender_profile_id, s]) || []);

      const bartendersWithSubs = (bartenderData || []).map(b => ({
        ...b,
        subscription: subMap.get(b.id) || null
      }));

      setBartenders(bartendersWithSubs);
    } catch (error) {
      console.error('Error fetching bartenders:', error);
      toast.error('Failed to load bartenders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBartenders();
    }
  }, [filter, isAdmin]);

  const toggleSubscription = async (bartenderId: string, currentStatus: string | undefined) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const expiresAt = newStatus === 'active' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        : null;

      const { data: existing } = await supabase
        .from('bartender_subscriptions')
        .select('id')
        .eq('bartender_profile_id', bartenderId)
        .single();

      if (existing) {
        await supabase
          .from('bartender_subscriptions')
          .update({ status: newStatus, expires_at: expiresAt })
          .eq('bartender_profile_id', bartenderId);
      } else {
        await supabase
          .from('bartender_subscriptions')
          .insert({
            bartender_profile_id: bartenderId,
            status: newStatus,
            expires_at: expiresAt,
            tier: 'basic',
            price_cents: 400000,
            currency: 'HUF'
          });
      }

      toast.success(`Subscription ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchBartenders();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const toggleActive = async (bartenderId: string, isActive: boolean) => {
    try {
      await supabase
        .from('bartender_profiles')
        .update({ is_active: !isActive })
        .eq('id', bartenderId);

      toast.success(`Bartender profile ${!isActive ? 'activated' : 'deactivated'}`);
      fetchBartenders();
    } catch (error) {
      console.error('Error toggling bartender status:', error);
      toast.error('Failed to update bartender status');
    }
  };

  const deleteBartender = async (bartenderId: string) => {
    if (!confirm('Are you sure you want to delete this bartender profile?')) return;

    try {
      await supabase.from('bartender_subscriptions').delete().eq('bartender_profile_id', bartenderId);
      await supabase.from('bartender_availability').delete().eq('bartender_profile_id', bartenderId);
      await supabase.from('bartender_booking_requests').delete().eq('bartender_profile_id', bartenderId);
      await supabase.from('bartender_reviews').delete().eq('bartender_profile_id', bartenderId);
      await supabase.from('bartender_profiles').delete().eq('id', bartenderId);

      toast.success('Bartender profile deleted');
      fetchBartenders();
    } catch (error) {
      console.error('Error deleting bartender:', error);
      toast.error('Failed to delete bartender');
    }
  };

  const getSubscriptionBadge = (subscription: BartenderProfile['subscription']) => {
    if (!subscription || subscription.status !== 'active') {
      return <Badge variant="secondary">No Subscription</Badge>;
    }
    const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date();
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge className="bg-amber-500/20 text-amber-500 border-0">Active</Badge>;
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
            <h1 className="text-3xl font-bold">Bartender Management</h1>
            <p className="text-muted-foreground mt-1">Manage bartender profiles and subscriptions</p>
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
        ) : bartenders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No {filter !== 'all' ? filter : ''} bartender profiles found
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bartenders.map((bartender) => (
              <Card key={bartender.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-amber-500/20">
                        <AvatarImage src={bartender.profile_photo || undefined} />
                        <AvatarFallback className="bg-amber-500/10 text-amber-500">
                          {bartender.bartender_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{bartender.bartender_name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {bartender.city}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getSubscriptionBadge(bartender.subscription)}
                      <Badge variant={bartender.is_active ? 'default' : 'secondary'}>
                        {bartender.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {bartender.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          <Wine className="h-2.5 w-2.5 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                      {bartender.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{bartender.skills.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {(bartender.rating || 0).toFixed(1)} ({bartender.review_count || 0})
                      </span>
                      {bartender.created_at && (
                        <span>
                          Joined: {format(new Date(bartender.created_at), 'PP')}
                        </span>
                      )}
                    </div>

                    {bartender.subscription?.expires_at && bartender.subscription.status === 'active' && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {format(new Date(bartender.subscription.expires_at), 'PPP')}
                      </p>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant={bartender.subscription?.status === 'active' ? 'destructive' : 'default'}
                        className="flex-1"
                        onClick={() => toggleSubscription(bartender.id, bartender.subscription?.status)}
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        {bartender.subscription?.status === 'active' ? 'Revoke Sub' : 'Grant Sub'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(bartender.id, bartender.is_active || false)}
                      >
                        {bartender.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteBartender(bartender.id)}
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

export default AdminBartenders;
