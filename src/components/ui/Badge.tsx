import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary text-white hover:bg-brand-primary/90",
        secondary:
          "border-transparent bg-brand-secondary text-white hover:bg-brand-secondary/90",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        success: 
          "border-transparent bg-green-100 text-green-700 hover:bg-green-200",
        warning:
          "border-transparent bg-brand-accent text-brand-text hover:bg-brand-accent/80",
        outline: "text-brand-text border-brand-border hover:bg-brand-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }