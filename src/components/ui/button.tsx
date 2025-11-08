import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-[hsl(var(--glass-light))] backdrop-blur-xl border border-border/30 hover:bg-[hsl(var(--glass-medium))] hover:border-border/50 hover:scale-[1.02]",
        "glass-active": "bg-[hsl(var(--glass-medium))] backdrop-blur-xl border border-primary/30 shadow-[0_0_15px_hsl(var(--prime-500)/0.4)] hover:shadow-[0_0_20px_hsl(var(--prime-500)/0.5)]",
        neon: "bg-accent text-accent-foreground shadow-[0_0_15px_hsl(var(--accent)/0.4)] hover:shadow-[0_0_20px_hsl(var(--accent)/0.5)] hover:scale-[1.02]",
        prime: "bg-gradient-to-br from-[hsl(var(--prime-500))] to-[hsl(var(--neon-pink))] text-primary-foreground shadow-[0_0_20px_hsl(var(--prime-500)/0.5)] hover:shadow-[0_0_30px_hsl(var(--prime-500)/0.6)] hover:scale-[1.02]",
        "ghost-glass": "hover:bg-[hsl(var(--glass-light))] hover:backdrop-blur-xl hover:border hover:border-border/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
