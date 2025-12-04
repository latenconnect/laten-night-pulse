import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Flag, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  pendingReports: number;
  pendingHosts: number;
  activeEvents: number;
  flaggedEvents: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
      const [
        { count: totalUsers },
        { count: totalEvents },
        { count: pendingReports },
        { count: pendingHosts },
        { count: activeEvents },
        { count: flaggedEvents }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('hosts').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('events').select('*', { count: 'exact', head: true }).gte('report_count', 3)
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        totalEvents: totalEvents || 0,
        pendingReports: pendingReports || 0,
        pendingHosts: pendingHosts || 0,
        activeEvents: activeEvents || 0,
        flaggedEvents: flaggedEvents || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Total Events', value: stats?.totalEvents, icon: Calendar, color: 'text-green-500' },
    { title: 'Active Events', value: stats?.activeEvents, icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Pending Reports', value: stats?.pendingReports, icon: Flag, color: 'text-orange-500', urgent: (stats?.pendingReports || 0) > 0 },
    { title: 'Pending Hosts', value: stats?.pendingHosts, icon: Shield, color: 'text-purple-500', urgent: (stats?.pendingHosts || 0) > 0 },
    { title: 'Flagged Events', value: stats?.flaggedEvents, icon: AlertTriangle, color: 'text-red-500', urgent: (stats?.flaggedEvents || 0) > 0 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of Laten platform activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <Card key={card.title} className={card.urgent ? 'border-destructive/50 bg-destructive/5' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{card.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(stats?.pendingReports || 0) > 0 && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <Flag className="h-5 w-5" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You have {stats?.pendingReports} pending report{stats?.pendingReports !== 1 ? 's' : ''} that need review.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
