import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingCart, X, CheckCheck, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NewOrderNotification } from "@/hooks/use-order-notifications";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NotificationBellProps {
  notifications: NewOrderNotification[];
  onDismiss: (id: number) => void;
  onDismissAll: () => void;
}

export function NotificationBell({ notifications, onDismiss, onDismissAll }: NotificationBellProps) {
  const count = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-secondary/30 text-muted-foreground hover:text-white hover:bg-secondary/60 transition-all duration-200 focus:outline-none">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/40"
              >
                {count > 9 ? "9+" : count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[340px] sm:w-[380px] p-0 bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl rounded-2xl overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/20">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-white">Notifications</span>
            {count > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                {count}
              </span>
            )}
          </div>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissAll}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-white gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[420px] overflow-y-auto">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/40 border border-border/40 mb-3">
                <Package className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-white">No new orders</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up! New orders will appear here.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <ShoppingCart className="h-4 w-4 text-emerald-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">New Order</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-snug">Order #{n.number} received</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.date_created), { addSuffix: true })}
                    </p>
                    <Link
                      href="/orders"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1.5 transition-colors"
                    >
                      View order <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => onDismiss(n.id)}
                    className="shrink-0 mt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                    title="Mark as read"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div className="px-4 py-2.5 border-t border-border/50 bg-secondary/10">
            <Link href="/orders" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              View all orders →
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
