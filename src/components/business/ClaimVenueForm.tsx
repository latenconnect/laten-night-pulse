import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, Shield, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useClubClaim, ClubClaim } from '@/hooks/useClubClaim';
import { z } from 'zod';

interface ClaimVenueFormProps {
  clubId: string;
  clubName: string;
}

const claimSchema = z.object({
  business_name: z.string().min(2, 'Business name is required').max(100),
  business_email: z.string().email('Valid email required').max(255),
  business_phone: z.string().optional(),
});

export const ClaimVenueForm: React.FC<ClaimVenueFormProps> = ({
  clubId,
  clubName,
}) => {
  const { t } = useLanguage();
  const { claim, loading, submitClaim, isPending, isVerified, isRejected } = useClubClaim(clubId);
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      claimSchema.parse(formData);
      setSubmitting(true);
      await submitClaim({
        business_name: formData.business_name,
        business_email: formData.business_email,
        business_phone: formData.business_phone || undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2 mb-4" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </Card>
    );
  }

  // Already claimed states
  if (claim) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          {isPending && (
            <>
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-lg">Claim Pending</h3>
                <p className="text-sm text-muted-foreground">
                  We're reviewing your claim for {clubName}. This usually takes 24-48 hours.
                </p>
              </div>
            </>
          )}
          {isVerified && (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-lg">Venue Verified!</h3>
                <p className="text-sm text-muted-foreground">
                  You own {clubName}. Access your dashboard to manage your venue.
                </p>
              </div>
            </>
          )}
          {isRejected && (
            <>
              <XCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Claim Rejected</h3>
                <p className="text-sm text-muted-foreground">
                  {claim.admin_notes || 'Your claim could not be verified. Please contact support.'}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{t('business.claimVenue')}</h3>
          <p className="text-sm text-muted-foreground">
            Verify ownership of <span className="font-medium text-foreground">{clubName}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="business_name"
              placeholder="Official business name"
              className="pl-10"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
          </div>
          {errors.business_name && (
            <p className="text-sm text-destructive">{errors.business_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_email">Business Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="business_email"
              type="email"
              placeholder="contact@yourvenue.com"
              className="pl-10"
              value={formData.business_email}
              onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
            />
          </div>
          {errors.business_email && (
            <p className="text-sm text-destructive">{errors.business_email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_phone">Phone Number (Optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="business_phone"
              type="tel"
              placeholder="+36 20 123 4567"
              className="pl-10"
              value={formData.business_phone}
              onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            We'll verify your claim within 24-48 hours. You may be contacted for additional verification.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Claim'}
        </Button>
      </form>
    </Card>
  );
};
