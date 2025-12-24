import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SubscriptionCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-10 h-10 text-muted-foreground" />
        </motion.div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Checkout Cancelled
        </h1>
        <p className="text-muted-foreground mb-8">
          No worries! Your payment was not processed. You can try again whenever you're ready.
        </p>
        
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(-1)} size="lg" className="w-full">
            Try Again
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            size="lg" 
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionCancelled;
