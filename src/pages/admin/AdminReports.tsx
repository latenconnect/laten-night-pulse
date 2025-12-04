import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Report {
  id: string;
  event_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  severity: string;
  status: string;
  created_at: string;
  event?: {
    name: string;
    is_active: boolean;
  };
  reporter?: {
    display_name: string;
    email: string;
  };
}

const AdminReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

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
      fetchReports();
    };

    checkAccess();
  }, [user, navigate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          event:events(name, is_active)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'resolved') {
        query = query.neq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch reporter profiles separately
      const reporterIds = [...new Set((data || []).map(r => r.reporter_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', reporterIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const reportsWithProfiles = (data || []).map(report => ({
        ...report,
        reporter: profileMap.get(report.reporter_id) || null
      }));

      setReports(reportsWithProfiles as Report[]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [filter, isAdmin]);

  const handleResolve = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action })
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Report ${action}`);
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    }
  };

  const handleDeactivateEvent = async (eventId: string, reportId: string) => {
    try {
      const { error: eventError } = await supabase
        .from('events')
        .update({ is_active: false })
        .eq('id', eventId);

      if (eventError) throw eventError;

      await handleResolve(reportId, 'resolved');
      toast.success('Event deactivated and report resolved');
    } catch (error) {
      console.error('Error deactivating event:', error);
      toast.error('Failed to deactivate event');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
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
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">Review and manage event reports</p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'resolved', 'all'] as const).map((f) => (
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No {filter !== 'all' ? filter : ''} reports found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {report.event?.name || 'Unknown Event'}
                        {!report.event?.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reported by {report.reporter?.display_name || 'Anonymous'} • {format(new Date(report.created_at), 'PPp')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(report.severity)}>
                        {report.severity}
                      </Badge>
                      <Badge variant={report.status === 'pending' ? 'outline' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Reason:</span>
                      <p className="text-sm text-muted-foreground">{report.reason}</p>
                    </div>
                    {report.description && (
                      <div>
                        <span className="text-sm font-medium">Description:</span>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    )}

                    {report.status === 'pending' && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/event/${report.event_id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Event
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeactivateEvent(report.event_id, report.id)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Deactivate Event
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleResolve(report.id, 'dismissed')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolve(report.id, 'resolved')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Resolve
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

export default AdminReports;
