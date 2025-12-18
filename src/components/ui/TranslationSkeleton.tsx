import { Skeleton } from '@/components/ui/skeleton';

interface TranslationSkeletonProps {
  className?: string;
  width?: string;
}

export const TranslationSkeleton = ({ className = '', width = 'w-24' }: TranslationSkeletonProps) => {
  return <Skeleton className={`h-4 ${width} inline-block ${className}`} />;
};

interface TranslationLoadingWrapperProps {
  isReady: boolean;
  children: React.ReactNode;
  skeletonWidth?: string;
  skeletonClassName?: string;
}

export const TranslationLoadingWrapper = ({ 
  isReady, 
  children, 
  skeletonWidth = 'w-24',
  skeletonClassName = ''
}: TranslationLoadingWrapperProps) => {
  if (!isReady) {
    return <TranslationSkeleton width={skeletonWidth} className={skeletonClassName} />;
  }
  return <>{children}</>;
};
