import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-900 border border-amber-300 shadow-md hover:bg-amber-50 hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm active:scale-[0.98]",
        destructive: "bg-white text-destructive border border-destructive/30 shadow-md hover:bg-destructive/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm active:scale-[0.98]",
        outline: "border border-input bg-white shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-none active:scale-[0.98]",
        secondary: "bg-white text-secondary-foreground border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-none active:scale-[0.98]",
        ghost: "hover:bg-white/80 hover:text-accent-foreground active:scale-[0.96] active:bg-white/60",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/70",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }