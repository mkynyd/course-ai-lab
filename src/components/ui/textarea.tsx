import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg bg-[var(--color-surface)] px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:bg-[var(--color-interaction-active)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:bg-destructive/10 md:text-sm dark:bg-[var(--color-interaction-hover)] dark:disabled:bg-[var(--color-interaction-hover)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
