import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface ActionSheetAction {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface IOSActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

const IOSActionSheet: React.FC<IOSActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancel',
}) => {
  const { lightTap, mediumTap } = useHaptics();

  const handleAction = async (action: ActionSheetAction) => {
    if (action.disabled) return;
    
    if (action.destructive) {
      await mediumTap();
    } else {
      await lightTap();
    }
    
    action.onClick();
    onClose();
  };

  const handleCancel = async () => {
    await lightTap();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleCancel}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40,
              mass: 1,
            }}
            className="fixed inset-x-0 bottom-0 z-50 safe-bottom-nav px-2 pb-2"
          >
            {/* Actions group */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--ios-grouped-secondary))' }}>
              {/* Header */}
              {(title || message) && (
                <div className="px-4 py-3 text-center border-b border-border/30">
                  {title && (
                    <p className="text-[13px] font-semibold text-muted-foreground">
                      {title}
                    </p>
                  )}
                  {message && (
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      {message}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  disabled={action.disabled}
                  className={cn(
                    'w-full py-4 text-center text-[20px] font-normal transition-colors',
                    'active:bg-muted disabled:opacity-50',
                    action.destructive ? 'text-destructive' : 'text-primary',
                    index < actions.length - 1 && 'border-b border-border/30'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Cancel button */}
            <button
              onClick={handleCancel}
              className="w-full mt-2 py-4 rounded-2xl text-center text-[20px] font-semibold text-primary active:bg-muted/80"
              style={{ background: 'hsl(var(--ios-grouped-secondary))' }}
            >
              {cancelLabel}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IOSActionSheet;
