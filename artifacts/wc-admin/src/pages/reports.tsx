import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ShoppingCart, DollarSign, Clock, RotateCcw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

type Period = "today" | "yesterday" | "7days" | "30days" | "thismonth" | "lastmonth";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "thismonth", label: "This Month" },
  { value: "lastmonth", label: "Last Month" },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  processing: "#6366f1",
  pending: "#eab308",
  "on-hold": "#f97316",
  cancelled: "#ef4444",
  refunded: "#a855f7",
  failed: "#f43f5e",
};

interface ReportData {
  period: string;
  total_orders: number;
  total_revenue: number;
  completed_revenue: number;
  avg_order_value: number;
  currency_symbol: string;
  timeseries: { date: string; revenue: number; orders: number }[];
  status_breakdown: { status: string; count: number; revenue: number }[];
  hourly_distribution: { hour: number; label: string; count: number }[];
}

async function fetchReports(period: string): Promise<ReportData> {
  const res = await fetch(`/api/orders/reports?period=${period}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

function fmtMoney(sym: string, v: number) {
  return `${sym}${v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM d"); } catch { return dateStr; }
}

const CustomTooltip = ({ active, payload, label, sym }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-white">
            {entry.name === "revenue" ? fmtMoney(sym ?? "₦", entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Reports() {
  const [period, setPeriod] = useState<Period>("7days");

  const { data, isLoading, isRefetching, refetch, error } = useQuery<ReportData>({
    queryKey: ["/api/orders/reports", period],
    queryFn: () => fetchReports(period),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const sym = data?.currency_symbol ?? "₦";

  const summaryCards = [
    {
      title: "Total Revenue",
      value: data ? fmtMoney(sym, data.total_revenue) : "—",
      sub: "All orders in period",
      icon: DollarSign,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Completed Revenue",
      value: data ? fmtMoney(sym, data.completed_revenue) : "—",
      sub: "Confirmed payments only",
      icon: TrendingUp,
      color: "text-green-400",
      border: "border-green-500/20",
      bg: "bg-green-500/10",
    },
    {
      title: "Total Orders",
      value: data ? data.total_orders.toLocaleString() : "—",
      sub: "Including all statuses",
      icon: ShoppingCart,
      color: "text-primary",
      border: "border-primary/20",
      bg: "bg-primary/10",
    },
    {
      title: "Avg. Order Value",
      value: data ? fmtMoney(sym, data.avg_order_value) : "—",
      sub: "Per completed transaction",
      icon: Clock,
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Reports</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Sales analytics and order trends.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="border-border/50 bg-secondary/20 h-9 text-xs gap-1.5 self-start"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2 bg-card/40 backdrop-blur-md p-2 rounded-xl border border-border/50">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              period === p.value
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && !data && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Failed to load reports. Check your connection and try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 border-border/50 h-8 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className={`border ${card.border} bg-card/40 backdrop-blur-xl`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-muted-foreground">{card.title}</span>
                  <div className={`h-7 w-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-28 bg-secondary" />
                ) : (
                  <div className="text-lg font-bold text-white tracking-tight">{card.value}</div>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue over time chart */}
      <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Revenue & Orders Over Time</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <Skeleton className="h-52 w-full bg-secondary rounded-lg" />
          ) : data && data.timeseries.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.timeseries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={(v) => `${sym}${Number(v).toLocaleString("en-NG")}`} />
                <Tooltip content={<CustomTooltip sym={sym} />} />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
          )}
        </CardContent>
      </Card>

      {/* Orders by hour + Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by hour */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Orders by Hour of Day</CardTitle>
            <p className="text-xs text-muted-foreground">When customers place orders most</p>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-44 w-full bg-secondary rounded-lg" />
            ) : data && data.hourly_distribution.some((h) => h.count > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.hourly_distribution} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v.split(":")[0]} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<CustomTooltip sym={sym} />} />
                  <Bar dataKey="count" name="orders" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Orders by Status</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution across all statuses</p>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-44 w-full bg-secondary rounded-lg" />
            ) : data && data.status_breakdown.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={data.status_breakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3}>
                      {data.status_breakdown.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, name: string) => [v, name]} contentStyle={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 flex-1 w-full">
                  {data.status_breakdown.map((entry) => (
                    <div key={entry.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[entry.status] ?? "#6b7280" }} />
                        <span className="capitalize text-muted-foreground">{entry.status.replace("-", " ")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{entry.count}</span>
                        <span className="text-muted-foreground text-[10px]">{fmtMoney(sym, entry.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders per day bar chart */}
      <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Daily Order Count</CardTitle>
          <p className="text-xs text-muted-foreground">Number of orders placed each day</p>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <Skeleton className="h-44 w-full bg-secondary rounded-lg" />
          ) : data && data.timeseries.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.timeseries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip sym={sym} />} />
                <Bar dataKey="orders" name="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
