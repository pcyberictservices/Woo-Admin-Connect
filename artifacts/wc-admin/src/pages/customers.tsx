import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, RotateCcw, X, ChevronLeft, ShoppingBag, TrendingUp, CheckCircle2, AlertTriangle, Clock, XCircle, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  billing: { phone?: string };
  orders_count: number;
  total_spent: string;
  date_created: string;
  avatar_url?: string;
}

interface CustomerDetail {
  customer: Customer;
  orders: Array<{
    id: number;
    number: string;
    status: string;
    total: string;
    date_created: string;
    line_items: Array<{ name: string; quantity: number; total: string }>;
  }>;
  stats: {
    total_orders: number;
    total_spent: string;
    completed: number;
    failed: number;
    on_hold: number;
    cancelled: number;
    processing: number;
    pending: number;
  };
  top_products: Array<{ name: string; quantity: number; total: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  processing: "#6366f1",
  pending: "#eab308",
  "on-hold": "#f97316",
  cancelled: "#ef4444",
  failed: "#f43f5e",
  refunded: "#a855f7",
};

async function fetchCustomers(params: { search?: string; page: number; per_page: number }) {
  const qs = new URLSearchParams({ page: String(params.page), per_page: String(params.per_page) });
  if (params.search) qs.set("search", params.search);
  const res = await fetch(`/api/customers?${qs}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json() as Promise<{ customers: Customer[]; total: number; total_pages: number }>;
}

async function fetchCustomerDetail(id: number) {
  const res = await fetch(`/api/customers/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch customer");
  return res.json() as Promise<CustomerDetail>;
}

function CustomerDetailView({ customerId, onBack }: { customerId: number; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/customers", customerId],
    queryFn: () => fetchCustomerDetail(customerId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-white gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to customers
        </Button>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-secondary/40 rounded-xl" />)}
      </div>
    );
  }

  if (!data) return null;

  const { customer, stats, top_products, orders } = data;
  const name = `${customer.first_name} ${customer.last_name}`.trim() || customer.email;

  const pieData = [
    { name: "Completed", value: stats.completed, color: STATUS_COLORS.completed },
    { name: "Processing", value: stats.processing, color: STATUS_COLORS.processing },
    { name: "Pending", value: stats.pending, color: STATUS_COLORS.pending },
    { name: "On Hold", value: stats.on_hold, color: STATUS_COLORS["on-hold"] },
    { name: "Cancelled", value: stats.cancelled, color: STATUS_COLORS.cancelled },
    { name: "Failed", value: stats.failed, color: STATUS_COLORS.failed },
  ].filter(d => d.value > 0);

  const statCards = [
    { title: "Total Orders", value: stats.total_orders, icon: ShoppingBag, color: "text-primary" },
    { title: "Total Spent", value: `₦${parseFloat(stats.total_spent).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-emerald-400" },
    { title: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-400" },
    { title: "Failed", value: stats.failed, icon: AlertTriangle, color: "text-rose-400" },
    { title: "On Hold", value: stats.on_hold, icon: Clock, color: "text-orange-400" },
    { title: "Cancelled", value: stats.cancelled, icon: XCircle, color: "text-red-400" },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 pb-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-white gap-2 -ml-1">
        <ChevronLeft className="h-4 w-4" /> Back to customers
      </Button>

      {/* Customer header */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xl">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{name}</h3>
          <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
          {customer.billing?.phone && <p className="text-xs text-muted-foreground">{customer.billing.phone}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Member since</p>
          <p className="text-sm text-white font-medium">{format(new Date(customer.date_created), "MMM d, yyyy")}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <Card key={card.title} className="bg-card/40 border-border/50 backdrop-blur-xl">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <card.icon className={`h-3.5 w-3.5 shrink-0 ${card.color}`} />
                <p className={`text-base font-bold ${card.color}`}>{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order status pie */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-muted-foreground">Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {pieData.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No orders yet</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 10% 14%)", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 min-w-0">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-[11px] text-muted-foreground truncate">{d.name}</span>
                      <span className="text-[11px] text-white font-medium ml-auto shrink-0">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top products bar */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-muted-foreground">Top Products Ordered</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {top_products.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No products yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={top_products.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 12%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false}
                    tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v} />
                  <Tooltip
                    formatter={(v) => [v, "Qty"]}
                    contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 10% 14%)", borderRadius: 8, fontSize: 11 }}
                  />
                  <Bar dataKey="quantity" fill="hsl(252 82% 64%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="bg-card/40 border-border/50 backdrop-blur-xl">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground">Order History</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {orders.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No orders found</p>
          ) : (
            <div className="divide-y divide-border/50">
              {orders.slice(0, 15).map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/[0.02]">
                  <div>
                    <span className="text-sm font-semibold text-white">#{order.number}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{format(new Date(order.date_created), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: STATUS_COLORS[order.status] ?? "#888" }}>
                      {order.status.replace(/-/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-white">₦{parseFloat(order.total).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["/api/customers", debouncedSearch, page],
    queryFn: () => fetchCustomers({ search: debouncedSearch || undefined, page, per_page: 20 }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const customers = data?.customers ?? [];

  if (selectedCustomerId !== null) {
    return <CustomerDetailView customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} />;
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Customers</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? "Loading..." : `${data?.total ?? 0} customers`}
            {isRefetching && <span className="ml-2 text-xs text-primary/60">Refreshing...</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}
          className="border-border/50 bg-secondary/20 h-9 text-xs gap-1.5 self-start sm:self-auto">
          <RotateCcw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 bg-card/40 border-border/50 h-9 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl overflow-hidden">
        {isLoading && !data ? (
          <div className="divide-y divide-border/50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full bg-secondary/40" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40 bg-secondary/40" />
                  <Skeleton className="h-3 w-52 bg-secondary/40" />
                </div>
                <Skeleton className="h-3.5 w-16 bg-secondary/40" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No customers found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            <AnimatePresence initial={false}>
              {customers.map((customer, i) => {
                const name = `${customer.first_name} ${customer.last_name}`.trim() || customer.email;
                const phone = customer.billing?.phone;
                return (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.025] cursor-pointer transition-colors group"
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                      {phone && <p className="text-xs text-muted-foreground/60">{phone}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ShoppingBag className="h-3 w-3" />
                        <span>{customer.orders_count ?? 0} orders</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        ₦{parseFloat(customer.total_spent ?? "0").toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">
            Page <span className="text-white font-medium">{page}</span> / <span className="text-white font-medium">{data.total_pages}</span>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="border-border/50 bg-background/50 h-8 text-xs">← Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages}
              className="border-border/50 bg-background/50 h-8 text-xs">Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
