import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHost } from '@/hooks/useHost';
import { useAuth } from '@/context/AuthContext';

const HostApplicationCard: React.FC = () => {
  const { user } = useAuth();
  const { host, applyAsHost, isVerifiedHost, isPendingHost, loading } = useHost();

  if (!user) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative overflow-hidden rounded-2xl p-6 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, hsl(270 91% 65% / 0.2) 0%, hsl(330 100% 65% / 0.2) 100%)',
        }}
      >
        <div className="absolute inset-0 border border-primary/30 rounded-2xl" />
        <div className="relative z-10">
          <h3 className="font-display font-bold text-lg mb-2">Become a Host</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to apply as a host and create your own events.
          </p>
          <Button variant="outline" size="sm" disabled>
            Sign in first
          </Button>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (isVerifiedHost) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, hsl(160 84% 39% / 0.2) 0%, hsl(180 100% 50% / 0.2) 100%)',
        }}
      >
        <div className="absolute inset-0 border border-secondary/30 rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Check className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg">Verified Host</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            You can now create and manage events. Events hosted: {host?.events_hosted || 0}
          </p>
          <Button variant="neon" size="sm" onClick={() => window.location.href = '/create'}>
            Create Event
          </Button>
        </div>
      </motion.div>
    );
  }

  if (isPendingHost) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, hsl(45 100% 50% / 0.2) 0%, hsl(30 100% 50% / 0.2) 100%)',
        }}
      >
        <div className="absolute inset-0 border border-yellow-500/30 rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="font-display font-bold text-lg">Application Pending</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Your host application is being reviewed. We'll notify you once it's approved.
          </p>
        </div>
      </motion.div>
    );
  }

  if (host?.verification_status === 'rejected') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, hsl(0 84% 60% / 0.2) 0%, hsl(0 100% 50% / 0.2) 100%)',
        }}
      >
        <div className="absolute inset-0 border border-destructive/30 rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-display font-bold text-lg">Application Declined</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Your host application was not approved. Please contact support for more information.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl p-6 cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, hsl(270 91% 65% / 0.2) 0%, hsl(330 100% 65% / 0.2) 100%)',
      }}
    >
      <div className="absolute inset-0 border border-primary/30 rounded-2xl" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Become a Host</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Create and manage your own events. Reach thousands of party-goers.
        </p>
        <Button variant="neon" size="sm" onClick={applyAsHost}>
          Apply Now
        </Button>
      </div>
    </motion.div>
  );
};

export default HostApplicationCard;
