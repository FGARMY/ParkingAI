"use client"
import { useAppStore } from '@/lib/store'
// Custom primitive-free Toaster
// We will create a simplified tailwind toaster instead of pulling in completely raw unstyled radix.

export function Toaster() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, variant = "default" }) {
        return (
          <div 
            key={id} 
            className={`pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full mt-4 ${
              variant === "destructive" ? "destructive group border-danger bg-danger text-danger-foreground" : "border-border bg-surface text-foreground"
            }`}
          >
            <div className="grid gap-1">
              {title && <div className="text-sm font-semibold">{title}</div>}
              {description && (
                <div className="text-sm opacity-90">{description}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(id)}
              className={`absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 ${
                variant === "destructive" ? "text-danger-foreground hover:text-danger-foreground/70" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              x
            </button>
          </div>
        )
      })}
    </div>
  )
}
