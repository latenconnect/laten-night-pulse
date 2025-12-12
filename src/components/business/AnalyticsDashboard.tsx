import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, MousePointer, Users, Share2, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface AnalyticsDashboardProps {
  type: 'club' | 'event';
  id: string;
}

interface AnalyticsData {
  date: string;
  views: number;
  clicks: number;
  shares: number;
  rsvps?: number;
  ticket_sales?: number;
  revenue_cents?: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  type,
  id,
}) => {
  const { t } = useLanguage();
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      try {
        const query = type === 'club' 
          ? supabase.from('club_analytics').select('*').eq('club_id', id)
          : supabase.from('event_analytics').select('*').eq('event_id', id);

        const { data: analyticsData, error } = await query
          .gte('date', startDate)
          .order('date', { ascending: true });

        if (error) throw error;
        setData((analyticsData as AnalyticsData[]) || []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [type, id, period]);

  const totals = data.reduce(
    (acc, day) => ({
      views: acc.views + (day.views || 0),
      clicks: acc.clicks + (day.clicks || 0),
      shares: acc.shares + (day.shares || 0),
      rsvps: acc.rsvps + (day.rsvps || 0),
      ticket_sales: acc.ticket_sales + (day.ticket_sales || 0),
      revenue_cents: acc.revenue_cents + (day.revenue_cents || 0),
    }),
    { views: 0, clicks: 0, shares: 0, rsvps: 0, ticket_sales: 0, revenue_cents: 0 }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const stats = [
    { label: t('host.views'), value: totals.views, icon: Eye, color: 'text-blue-500' },
    { label: t('host.clicks'), value: totals.clicks, icon: MousePointer, color: 'text-green-500' },
    { label: t('common.share'), value: totals.shares, icon: Share2, color: 'text-purple-500' },
    ...(type === 'event'
      ? [
          { label: t('host.rsvps'), value: totals.rsvps, icon: Users, color: 'text-pink-500' },
          { label: t('host.ticketSales'), value: totals.ticket_sales, icon: TrendingUp, color: 'text-orange-500' },
          { label: t('host.revenue'), value: formatCurrency(totals.revenue_cents), icon: DollarSign, color: 'text-emerald-500' },
        ]
      : []),
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">{t('host.analytics')}</h3>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs px-2">7D</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-2">30D</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs px-2">90D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No analytics data yet</p>
          <p className="text-sm">Data will appear as users interact with your {type}</p>
        </div>
      )}
    </Card>
  );
};
