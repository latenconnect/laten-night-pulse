import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Instagram, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SocialShareTemplatesProps {
  event: {
    id: string;
    name: string;
    startTime: Date;
    location: {
      name: string;
      city: string;
    };
    price: number | null;
    type: string;
  };
}

interface Template {
  id: string;
  name: string;
  platform: 'instagram' | 'whatsapp' | 'general';
  icon: typeof Instagram;
  content: string;
}

export const SocialShareTemplates: React.FC<SocialShareTemplatesProps> = ({ event }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const eventUrl = `https://laten.app/event/${event.id}`;
  const formattedDate = format(event.startTime, 'EEEE, MMMM d');
  const formattedTime = format(event.startTime, 'h:mm a');
  const priceText = event.price ? `${event.price} Ft` : 'FREE';

  const templates: Template[] = [
    {
      id: 'instagram-story',
      name: 'Instagram Story',
      platform: 'instagram',
      icon: Instagram,
      content: `🎉 ${event.name}

📅 ${formattedDate}
⏰ ${formattedTime}
📍 ${event.location.name}, ${event.location.city}
🎟️ ${priceText}

Link in bio or DM me for details! 🔥

#party #${event.location.city.toLowerCase()} #nightlife #event`,
    },
    {
      id: 'instagram-caption',
      name: 'Instagram Post',
      platform: 'instagram',
      icon: Instagram,
      content: `Who's ready?! 🙌

${event.name} is happening ${formattedDate}!

📍 ${event.location.name}
🎟️ ${priceText} entry

Tag someone you want to bring! 👇

#${event.location.city.toLowerCase()}nightlife #partyvibes #weekendplans`,
    },
    {
      id: 'whatsapp-invite',
      name: 'WhatsApp Invite',
      platform: 'whatsapp',
      icon: MessageCircle,
      content: `Hey! 👋

I'm hosting an event and would love for you to come!

🎉 *${event.name}*
📅 ${formattedDate} at ${formattedTime}
📍 ${event.location.name}, ${event.location.city}
🎟️ ${priceText}

RSVP here: ${eventUrl}

See you there! 🎊`,
    },
    {
      id: 'whatsapp-group',
      name: 'Group Chat',
      platform: 'whatsapp',
      icon: MessageCircle,
      content: `🚨 *PARTY ALERT* 🚨

${event.name}
${formattedDate} • ${formattedTime}
${event.location.name}

Entry: ${priceText}

Who's in?! 🙋‍♂️🙋‍♀️

${eventUrl}`,
    },
    {
      id: 'general-share',
      name: 'Quick Share',
      platform: 'general',
      icon: Share2,
      content: `${event.name} | ${formattedDate} | ${event.location.city} | ${priceText}

${eventUrl}`,
    },
  ];

  const handleCopy = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopiedId(template.id);
      toast.success(`${template.name} template copied!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async (template: Template) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: template.content,
          url: eventUrl,
        });
      } catch (err) {
        // User cancelled or error
        handleCopy(template);
      }
    } else {
      handleCopy(template);
    }
  };

  const platformColors = {
    instagram: 'from-pink-500 to-purple-600',
    whatsapp: 'from-green-500 to-green-600',
    general: 'from-primary to-primary/80',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Share Templates</h3>
        <Badge variant="outline" className="text-xs">Party Boost</Badge>
      </div>

      <div className="space-y-3">
        {templates.map((template, index) => {
          const Icon = template.icon;
          const isCopied = copiedId === template.id;
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden border-border/50 bg-muted/20">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white",
                        platformColors[template.platform]
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3"
                        onClick={() => handleCopy(template)}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3"
                        onClick={() => handleShare(template)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans bg-background/50 p-2 rounded-lg max-h-24 overflow-y-auto">
                    {template.content}
                  </pre>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Tap copy to grab the text, or share directly to your favorite app
      </p>
    </div>
  );
};

export default SocialShareTemplates;
