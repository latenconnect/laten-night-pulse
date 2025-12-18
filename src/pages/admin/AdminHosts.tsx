import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, User, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Host {
  id: string;
  user_id: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  rating: number;
  events_hosted: number;
  created_at: string;
  verified_at: string | null;
  profile?: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

const AdminHosts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');

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

  const fetchHosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('hosts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set((data || []).map(h => h.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const hostsWithProfiles = (data || []).map(host => ({
        ...host,
        profile: profileMap.get(host.user_id) || null
      }));

      setHosts(hostsWithProfiles as Host[]);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      toast.error('Failed to load hosts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchHosts();
    }
  }, [filter, isAdmin]);

  const handleVerification = async (hostId: string, status: 'verified' | 'rejected') => {
    try {
      const updateData: any = { verification_status: status };
      if (status === 'verified') {
        updateData.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('hosts')
        .update(updateData)
        .eq('id', hostId);

      if (error) throw error;

      toast.success(`Host ${status === 'verified' ? 'approved' : 'rejected'}`);
      fetchHosts();
    } catch (error) {
      console.error('Error updating host:', error);
      toast.error('Failed to update host');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Host Verification</h1>
            <p className="text-muted-foreground mt-1">Review and approve host applications</p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'verified', 'rejected', 'all'] as const).map((f) => (
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
                <CardContent className="h-40" />
              </Card>
            ))}
          </div>
        ) : hosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No {filter !== 'all' ? filter : ''} host applications found
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hosts.map((host) => (
              <Card key={host.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {host.profile?.avatar_url ? (
                          <img
                            src={host.profile.avatar_url}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {host.profile?.display_name || 'Unknown User'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ID: {host.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(host.verification_status)}>
                      {host.verification_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {host.events_hosted} events
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {host.rating.toFixed(1)} rating
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Applied: {format(new Date(host.created_at), 'PPP')}
                    </p>
                    {host.verified_at && (
                      <p className="text-sm text-muted-foreground">
                        Verified: {format(new Date(host.verified_at), 'PPP')}
                      </p>
                    )}

                    {host.verification_status === 'pending' && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVerification(host.id, 'verified')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleVerification(host.id, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
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

export default AdminHosts;
