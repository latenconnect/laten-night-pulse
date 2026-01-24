import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface NativePageTransitionProps {
  children: React.ReactNode;
  mode?: 'slide' | 'fade' | 'modal' | 'push';
}

// iOS-style page transition variants
const slideVariants: Variants = {
  initial: {
    x: '100%',
    opacity: 0.8,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    x: '-30%',
    opacity: 0.5,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

const modalVariants: Variants = {
  initial: {
    y: '100%',
    opacity: 0.9,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 35,
    },
  },
  exit: {
    y: '100%',
    opacity: 0.5,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 35,
    },
  },
};

const pushVariants: Variants = {
  initial: {
    x: '100%',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
  },
  animate: {
    x: 0,
    boxShadow: '0 0 0 rgba(0,0,0,0)',
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 30,
    },
  },
  exit: {
    x: '-20%',
    opacity: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

const variantMap = {
  slide: slideVariants,
  fade: fadeVariants,
  modal: modalVariants,
  push: pushVariants,
};

export const NativePageTransition: React.FC<NativePageTransitionProps> = ({
  children,
  mode = 'slide',
}) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variantMap[mode]}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Individual transition wrappers for different use cases
export const SlideInPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ x: '100%', opacity: 0.8 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: '-30%', opacity: 0.5 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    style={{ willChange: 'transform, opacity' }}
  >
    {children}
  </motion.div>
);

export const FadeInPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

export const ModalPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ y: '100%', opacity: 0.9 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: '100%', opacity: 0.5 }}
    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    style={{ willChange: 'transform, opacity' }}
  >
    {children}
  </motion.div>
);

export default NativePageTransition;
