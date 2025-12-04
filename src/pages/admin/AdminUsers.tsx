import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Search, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  city: string | null;
  created_at: string;
  roles?: string[];
}

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, display_name, email, city, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Fetch roles for these users
      const userIds = (profiles || []).map(p => p.id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesMap = new Map<string, string[]>();
      roles?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role]);
      });

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        roles: rolesMap.get(profile.id) || ['user']
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      const debounce = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [search, isAdmin]);

  const toggleRole = async (userId: string, role: 'admin' | 'moderator', hasRole: boolean) => {
    try {
      if (hasRole) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
      }

      toast.success(`Role ${hasRole ? 'removed' : 'added'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
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
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground mt-1">Manage platform users and roles</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-20" />
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No users found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{profile.display_name || 'No name'}</span>
                          {profile.roles?.includes('admin') && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                          {profile.roles?.includes('moderator') && (
                            <Badge>Moderator</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{profile.email}</span>
                          {profile.city && <span>• {profile.city}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(profile.created_at), 'PP')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={profile.roles?.includes('moderator') ? 'default' : 'outline'}
                        onClick={() => toggleRole(profile.id, 'moderator', profile.roles?.includes('moderator') || false)}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Mod
                      </Button>
                      <Button
                        size="sm"
                        variant={profile.roles?.includes('admin') ? 'destructive' : 'outline'}
                        onClick={() => toggleRole(profile.id, 'admin', profile.roles?.includes('admin') || false)}
                        disabled={profile.id === user?.id}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Admin
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

export default AdminUsers;
