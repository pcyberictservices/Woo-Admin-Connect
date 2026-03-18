import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NewOrderNotification } from "@/hooks/use-order-notifications";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface NotificationBarProps {
  notifications: NewOrderNotification[];
  onDismiss: (id: number) => void;
  onDismissAll: () => void;
}

export function NotificationBar({ notifications, onDismiss, onDismissAll }: NotificationBarProps) {
  return (
    <div className="fixed top-0 right-0 z-[100] flex flex-col gap-2 p-4 pointer-events-none" style={{ maxWidth: 420 }}>
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-start gap-3 bg-card border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 rounded-xl p-4 backdrop-blur-xl"
          >
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  New Order
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">Order #{n.number} received</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(n.date_created), { addSuffix: true })}
              </p>
              <Link href="/orders" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1 transition-colors">
                View order <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <button
              onClick={() => onDismiss(n.id)}
              className="shrink-0 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {notifications.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto flex justify-end"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={onDismissAll}
            className="text-xs border-border/50 bg-card/80 backdrop-blur-sm"
          >
            Dismiss all
          </Button>
        </motion.div>
      )}
    </div>
  );
}

interface NotificationBellProps {
  count: number;
}

export function NotificationBell({ count }: NotificationBellProps) {
  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  );
}
