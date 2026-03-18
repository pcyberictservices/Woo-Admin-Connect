import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

export type OrderStatus = "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed";

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const normalized = status.toLowerCase() as OrderStatus;
  
  const config = {
    pending: {
      label: "Pending",
      icon: Clock,
      classes: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    },
    processing: {
      label: "Processing",
      icon: Loader2,
      classes: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    "on-hold": {
      label: "On Hold",
      icon: AlertCircle,
      classes: "bg-orange-500/10 text-orange-400 border-orange-500/20"
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      classes: "bg-red-500/10 text-red-400 border-red-500/20"
    },
    refunded: {
      label: "Refunded",
      icon: RefreshCw,
      classes: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
    failed: {
      label: "Failed",
      icon: AlertTriangle,
      classes: "bg-rose-900/40 text-rose-500 border-rose-900/50"
    },
  };

  const current = config[normalized] || {
    label: status,
    icon: Clock,
    classes: "bg-secondary text-muted-foreground border-border"
  };

  const Icon = current.icon;

  return (
    <Badge 
      variant="outline" 
      className={clsx(
        "font-medium py-1 px-2.5 gap-1.5 whitespace-nowrap overflow-hidden no-default-active-elevate transition-colors",
        current.classes,
        className
      )}
    >
      <Icon className={clsx("h-3 w-3", normalized === "processing" && "animate-spin")} />
      <span className="capitalize">{current.label}</span>
    </Badge>
  );
}
