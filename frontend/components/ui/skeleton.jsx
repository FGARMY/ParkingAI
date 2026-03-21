import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral", className)}
      {...props}
    />
  )
}

export { Skeleton }
