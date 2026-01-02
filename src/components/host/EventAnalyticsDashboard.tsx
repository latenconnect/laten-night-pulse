import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, MousePointer, Share2, Users, Ticket, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EventAnalyticsDashboardProps {
  eventId: string;
}

interface AnalyticsData {
  date: string;
  views: number;
  clicks: number;
  shares: number;
  rsvps: number;
  ticket_sales: number;
}

export const EventAnalyticsDashboard: React.FC<EventAnalyticsDashboardProps> = ({ eventId }) => {
  const { t } = useLanguage();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: async () => {
      // Get last 30 days of analytics
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('event_analytics')
        .select('*')
        .eq('event_id', eventId)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as AnalyticsData[];
    },
    enabled: !!eventId,
  });

  // Calculate totals
  const totals = React.useMemo(() => {
    if (!analytics || analytics.length === 0) {
      return { views: 0, clicks: 0, shares: 0, rsvps: 0, ticketSales: 0 };
    }
    return analytics.reduce(
      (acc, day) => ({
        views: acc.views + (day.views || 0),
        clicks: acc.clicks + (day.clicks || 0),
        shares: acc.shares + (day.shares || 0),
        rsvps: acc.rsvps + (day.rsvps || 0),
        ticketSales: acc.ticketSales + (day.ticket_sales || 0),
      }),
      { views: 0, clicks: 0, shares: 0, rsvps: 0, ticketSales: 0 }
    );
  }, [analytics]);

  // Format chart data
  const chartData = React.useMemo(() => {
    if (!analytics) return [];
    return analytics.map(day => ({
      date: format(new Date(day.date), 'MMM d'),
      views: day.views || 0,
      clicks: day.clicks || 0,
      rsvps: day.rsvps || 0,
    }));
  }, [analytics]);

  const stats = [
    { label: 'Views', value: totals.views, icon: Eye, color: 'text-blue-500' },
    { label: 'Clicks', value: totals.clicks, icon: MousePointer, color: 'text-green-500' },
    { label: 'Shares', value: totals.shares, icon: Share2, color: 'text-purple-500' },
    { label: 'RSVPs', value: totals.rsvps, icon: Users, color: 'text-pink-500' },
    { label: 'Tickets', value: totals.ticketSales, icon: Ticket, color: 'text-amber-500' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.slice(0, 3).map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-muted/30 border-border/50">
              <CardContent className="p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.slice(3).map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-muted/30 border-border/50">
              <CardContent className="p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="bg-muted/30 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && (
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No analytics data yet</p>
            <p className="text-xs">Data will appear as users interact with your event</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventAnalyticsDashboard;
