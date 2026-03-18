import { useGetOrderStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Package
} from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetOrderStats();

  const cards = [
    {
      title: "Total Revenue",
      value: stats?.total_revenue ? `$${stats.total_revenue}` : "$0.00",
      icon: TrendingUp,
      color: "from-emerald-500/20 to-emerald-500/0 text-emerald-500",
      border: "border-emerald-500/20",
    },
    {
      title: "Total Orders",
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: "from-primary/20 to-primary/0 text-primary",
      border: "border-primary/20",
    },
    {
      title: "Completed",
      value: stats?.completed || 0,
      icon: CheckCircle2,
      color: "from-blue-500/20 to-blue-500/0 text-blue-500",
      border: "border-blue-500/20",
    },
    {
      title: "Processing",
      value: stats?.processing || 0,
      icon: Package,
      color: "from-indigo-500/20 to-indigo-500/0 text-indigo-500",
      border: "border-indigo-500/20",
    },
    {
      title: "Pending",
      value: stats?.pending || 0,
      icon: Clock,
      color: "from-yellow-500/20 to-yellow-500/0 text-yellow-500",
      border: "border-yellow-500/20",
    },
    {
      title: "On Hold",
      value: stats?.on_hold || 0,
      icon: AlertCircle,
      color: "from-orange-500/20 to-orange-500/0 text-orange-500",
      border: "border-orange-500/20",
    },
    {
      title: "Refunded",
      value: stats?.refunded || 0,
      icon: RefreshCw,
      color: "from-purple-500/20 to-purple-500/0 text-purple-500",
      border: "border-purple-500/20",
    },
    {
      title: "Cancelled",
      value: stats?.cancelled || 0,
      icon: AlertCircle,
      color: "from-red-500/20 to-red-500/0 text-red-500",
      border: "border-red-500/20",
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">Store Overview</h2>
        <p className="text-muted-foreground">Monitor your WooCommerce store performance and active orders.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24 bg-secondary" />
                <Skeleton className="h-8 w-8 rounded-full bg-secondary" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {cards.map((card, i) => (
            <motion.div key={i} variants={item}>
              <Card className={`relative overflow-hidden border ${card.border} bg-card/40 backdrop-blur-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.color} rounded-bl-[100px] opacity-40 pointer-events-none`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-xl bg-card border ${card.border} shadow-sm`}>
                    <card.icon className={`h-4 w-4 ${card.color.split(" ").pop()}`} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white tracking-tight">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
