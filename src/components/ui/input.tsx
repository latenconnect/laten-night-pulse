import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex w-full rounded-xl border bg-card/80 text-foreground",
          // Sizing - iOS style taller inputs
          "h-12 px-4 py-3 text-[16px]",
          // Border and focus states
          "border-border/50 transition-all duration-200 ease-out",
          "focus:border-primary/60 focus:outline-none focus:ring-[3px] focus:ring-primary/15",
          // Placeholder
          "placeholder:text-muted-foreground/60",
          // File inputs
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
