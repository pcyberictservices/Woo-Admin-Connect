import { useGetOrderStats } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Package,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isRefetching, refetch } = useGetOrderStats({
    query: { refetchInterval: 60_000, staleTime: 30_000 }
  });

  const sym = stats?.currency_symbol ?? "₦";

  const fmtMoney = (v: string | number | undefined) => {
    if (!v) return `${sym}0.00`;
    const num = parseFloat(String(v));
    if (isNaN(num)) return `${sym}0.00`;
    return `${sym}${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const cards = [
    {
      title: "Total Revenue",
      value: fmtMoney(stats?.total_revenue),
      sub: "All-time gross sales",
      icon: TrendingUp,
      color: "from-emerald-500/20 to-emerald-500/0 text-emerald-500",
      border: "border-emerald-500/20",
    },
    {
      title: "Completed Revenue",
      value: fmtMoney(stats?.completed_revenue),
      sub: "From completed orders only",
      icon: CheckCircle2,
      color: "from-green-500/20 to-green-500/0 text-green-400",
      border: "border-green-500/20",
    },
    {
      title: "Total Orders",
      value: (stats?.total_orders ?? 0).toLocaleString(),
      sub: "All statuses",
      icon: ShoppingCart,
      color: "from-primary/20 to-primary/0 text-primary",
      border: "border-primary/20",
    },
    {
      title: "Completed",
      value: (stats?.completed ?? 0).toLocaleString(),
      sub: "Fulfilled orders",
      icon: CheckCircle2,
      color: "from-blue-500/20 to-blue-500/0 text-blue-500",
      border: "border-blue-500/20",
    },
    {
      title: "Processing",
      value: (stats?.processing ?? 0).toLocaleString(),
      sub: "Being prepared",
      icon: Package,
      color: "from-indigo-500/20 to-indigo-500/0 text-indigo-500",
      border: "border-indigo-500/20",
    },
    {
      title: "Pending",
      value: (stats?.pending ?? 0).toLocaleString(),
      sub: "Awaiting payment",
      icon: Clock,
      color: "from-yellow-500/20 to-yellow-500/0 text-yellow-500",
      border: "border-yellow-500/20",
    },
    {
      title: "On Hold",
      value: (stats?.on_hold ?? 0).toLocaleString(),
      sub: "Awaiting confirmation",
      icon: AlertCircle,
      color: "from-orange-500/20 to-orange-500/0 text-orange-500",
      border: "border-orange-500/20",
    },
    {
      title: "Cancelled",
      value: (stats?.cancelled ?? 0).toLocaleString(),
      sub: "Cancelled by customer",
      icon: XCircle,
      color: "from-red-500/20 to-red-500/0 text-red-500",
      border: "border-red-500/20",
    },
    {
      title: "Refunded",
      value: (stats?.refunded ?? 0).toLocaleString(),
      sub: "Money returned",
      icon: RefreshCw,
      color: "from-purple-500/20 to-purple-500/0 text-purple-500",
      border: "border-purple-500/20",
    },
    {
      title: "Failed",
      value: (stats?.failed ?? 0).toLocaleString(),
      sub: "Payment failed",
      icon: AlertTriangle,
      color: "from-rose-500/20 to-rose-500/0 text-rose-500",
      border: "border-rose-500/20",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Store Overview</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Real-time WooCommerce store performance.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-border/50 bg-secondary/20 h-9 text-xs gap-1.5"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/reports">
            <Button size="sm" className="h-9 text-xs bg-primary/80 hover:bg-primary gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Reports
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <Skeleton className="h-3 w-20 bg-secondary" />
                <Skeleton className="h-7 w-7 rounded-full bg-secondary" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Skeleton className="h-7 w-24 bg-secondary" />
                <Skeleton className="h-2.5 w-16 bg-secondary mt-1.5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {cards.map((card, i) => (
            <motion.div key={i} variants={item}>
              <Card className={`relative overflow-hidden border ${card.border} bg-card/40 backdrop-blur-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default`}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.color} rounded-bl-[80px] opacity-40 pointer-events-none`} />
                <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4 relative z-10">
                  <CardTitle className="text-[11px] font-medium text-muted-foreground leading-tight">
                    {card.title}
                  </CardTitle>
                  <div className={`p-1.5 rounded-lg bg-card border ${card.border}`}>
                    <card.icon className={`h-3.5 w-3.5 ${card.color.split(" ").pop()}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 relative z-10">
                  <div className="text-xl font-bold text-white tracking-tight leading-tight">
                    {card.value}
                  </div>
                  {card.sub && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{card.sub}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/orders">
          <Button variant="outline" size="sm" className="border-border/50 bg-secondary/20 h-9 text-sm gap-2">
            <ShoppingCart className="h-4 w-4" />
            View all orders
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline" size="sm" className="border-border/50 bg-secondary/20 h-9 text-sm gap-2">
            <TrendingUp className="h-4 w-4" />
            View reports
          </Button>
        </Link>
      </div>
    </div>
  );
}
