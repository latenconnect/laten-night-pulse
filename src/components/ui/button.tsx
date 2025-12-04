import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_20px_hsla(270,91%,65%,0.4)] hover:shadow-[0_0_30px_hsla(270,91%,65%,0.6)] hover:-translate-y-0.5 active:translate-y-0",
        neon:
          "bg-gradient-to-r from-primary via-neon-pink to-secondary text-primary-foreground shadow-[0_0_25px_hsla(270,91%,65%,0.5)] hover:shadow-[0_0_40px_hsla(270,91%,65%,0.7)] hover:-translate-y-1 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-primary/50 bg-primary/10 text-primary-foreground hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_20px_hsla(270,91%,65%,0.3)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_0_20px_hsla(180,100%,50%,0.3)] hover:shadow-[0_0_30px_hsla(180,100%,50%,0.5)] hover:-translate-y-0.5",
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-card/60 backdrop-blur-xl border border-border/50 text-foreground hover:bg-card/80 hover:border-primary/30",
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
