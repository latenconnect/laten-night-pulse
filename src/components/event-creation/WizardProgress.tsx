import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon: string;
}

interface WizardProgressProps {
  steps: Step[];
  currentStep: number;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <React.Fragment key={step.id}>
              <motion.div
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  isCompleted || isCurrent
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
                initial={false}
                animate={{
                  backgroundColor: isCompleted || isCurrent 
                    ? 'hsl(270, 91%, 65%)' 
                    : 'hsl(240, 15%, 15%)',
                }}
              >
                {isCurrent && (
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Step Labels - Hidden on mobile, shown on larger screens */}
      <div className="hidden sm:flex items-center justify-between mt-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                isCurrent ? 'text-primary font-medium' : 
                isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
              )}
            >
              {isCompleted ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <span>{step.icon}</span>
              )}
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
