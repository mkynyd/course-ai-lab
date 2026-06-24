import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "flex field-sizing-content min-h-16 w-full rounded-[var(--radius-md)] bg-[var(--color-surface)] px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-destructive/10 md:text-sm dark:bg-[var(--color-interaction-hover)] dark:disabled:bg-[var(--color-interaction-hover)]",
          className
        )}
        {...props}
      />
    )
  }
)

export { Textarea }
