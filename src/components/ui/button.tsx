import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_20px_hsla(270,91%,65%,0.35)] hover:shadow-[0_0_28px_hsla(270,91%,65%,0.5)] hover:-translate-y-0.5",
        neon:
          "bg-gradient-to-r from-primary via-neon-pink to-secondary text-primary-foreground shadow-[0_0_24px_hsla(270,91%,65%,0.45)] hover:shadow-[0_0_36px_hsla(270,91%,65%,0.6)] hover:-translate-y-1",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border/50 bg-card/60 text-foreground hover:border-primary/40 hover:bg-card/80",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_0_18px_hsla(180,100%,50%,0.25)] hover:shadow-[0_0_26px_hsla(180,100%,50%,0.4)] hover:-translate-y-0.5",
        ghost:
          "text-foreground hover:bg-muted/60",
        link: 
          "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-card/50 backdrop-blur-xl border border-border/40 text-foreground hover:bg-card/70 hover:border-primary/30",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
