import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MessageCircle, HelpCircle, ChevronDown, Send, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

const faqs = [
  {
    question: "How do I create an event?",
    answer: "To create an event, you need to become a host first. Go to your profile, tap 'Become a Host', and follow the verification process. Once verified, you can create events from the Create Event page."
  },
  {
    question: "How do I book a DJ or bartender?",
    answer: "Browse our professional marketplace by tapping on 'Hire Professionals' from the Explore page. You can filter by city, genre, price range, and experience level. Once you find someone you like, tap 'Book' to send a booking request."
  },
  {
    question: "Is my payment information secure?",
    answer: "Yes, all payments are processed through Stripe, a PCI-compliant payment processor. We never store your full card details on our servers."
  },
  {
    question: "How do I verify my age?",
    answer: "Age verification is required for certain events. You can complete age verification through our partner Didit by going to your profile settings and tapping 'Verify Age'."
  },
  {
    question: "How can I report an event or user?",
    answer: "You can report any event or user by tapping the three dots menu on their profile or event page and selecting 'Report'. Our moderation team reviews all reports within 24 hours."
  },
  {
    question: "How do I delete my account?",
    answer: "You can delete your account from Profile > Settings > Delete Account. Please note this action is irreversible and will remove all your data, including events and bookings."
  },
  {
    question: "What cities is Laten available in?",
    answer: "Laten is currently available in major European cities including Budapest, Vienna, Prague, Berlin, and more. We're constantly expanding to new cities!"
  },
  {
    question: "How do I become a verified professional?",
    answer: "To become a verified DJ, bartender, photographer, or security professional, create a professional profile from the marketplace section and complete the verification process with your portfolio and credentials."
  }
];

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission - in production, this would send to an edge function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Message sent successfully! We\'ll get back to you within 24-48 hours.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Support</h1>
          <div className="w-10" />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-6 pb-24 space-y-8"
      >
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">How can we help?</h2>
          <p className="text-muted-foreground">
            Find answers to common questions or get in touch with our team
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a 
            href="mailto:support@laten.app" 
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors"
          >
            <Mail className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium">Email Us</span>
            <span className="text-xs text-muted-foreground">support@laten.app</span>
          </a>
          <a 
            href="https://instagram.com/laten.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium">DM on Instagram</span>
            <span className="text-xs text-muted-foreground">@laten.app</span>
          </a>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="bg-card border border-border/50 rounded-xl px-4 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Us</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Input
                name="email"
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Input
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={errors.subject ? 'border-destructive' : ''}
              />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Textarea
                name="message"
                placeholder="How can we help you?"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className={errors.message ? 'border-destructive' : ''}
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Legal Links */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <h3 className="text-sm font-medium text-muted-foreground">Legal</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/privacy')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Privacy Policy
              <ExternalLink className="w-3 h-3" />
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Terms of Service
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Support;
