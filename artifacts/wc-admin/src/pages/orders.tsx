import { useState } from "react";
import { format } from "date-fns";
import { Search, SlidersHorizontal, ShoppingCart } from "lucide-react";
import { useGetOrders } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { OrderDetailSheet } from "@/components/order/order-detail-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const STATUS_FILTERS = [
  { value: "any", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

const STATUS_ACTIONS = [
  { value: "pending", label: "Pending payment" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

export default function Orders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("any");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data, isLoading, error } = useGetOrders({
    page,
    per_page: 20,
    search: debouncedSearch || undefined,
    status: status !== "any" ? status : undefined,
  });

  const orders = data?.orders ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-5">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Orders</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? "Loading..." : `${data?.total ?? 0} orders total`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-3 items-center bg-card/40 backdrop-blur-md p-3 rounded-xl border border-border/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order # or customer name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/50 h-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
            <SelectTrigger className="w-[170px] bg-background/50 border-border/50 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-secondary/50 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="pl-5 w-[110px]">Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right pr-5">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell className="pl-5"><Skeleton className="h-4 w-16 bg-secondary" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-secondary" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36 bg-secondary" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full bg-secondary" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-6 ml-auto bg-secondary" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto bg-secondary" /></TableCell>
                    <TableCell className="text-right pr-5"><Skeleton className="h-7 w-24 ml-auto bg-secondary rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-[300px] text-center text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>Failed to load orders. Check your WooCommerce API connection.</p>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-[300px] text-center text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No orders found</p>
                    {(search || status !== "any") && (
                      <Button variant="outline" size="sm" className="mt-3 border-border/50"
                        onClick={() => { setSearch(""); setStatus("any"); }}>
                        Clear filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group border-border/50 hover:bg-white/[0.025] transition-colors cursor-pointer"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <TableCell className="pl-5 font-semibold text-white">
                      <span className="group-hover:text-primary transition-colors">#{order.number}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(order.date_created), "MMM d, yyyy")}
                      <div className="text-xs opacity-60">{format(new Date(order.date_created), "h:mm a")}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-white text-sm">
                        {order.billing.first_name} {order.billing.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{order.billing.email}</div>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {order.line_items.reduce((acc, item) => acc + item.quantity, 0)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-white">
                      <span dangerouslySetInnerHTML={{ __html: order.currency_symbol ?? order.currency }} />
                      {parseFloat(order.total).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                      <Select
                        defaultValue={order.status}
                        onValueChange={async (newStatus) => {
                          try {
                            await fetch(`/api/orders/${order.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ status: newStatus }),
                            });
                          } catch { /* ignore */ }
                        }}
                      >
                        <SelectTrigger className="w-[130px] h-7 text-xs bg-secondary/40 border-border/50 focus:ring-primary/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ACTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && data && data.total_pages > 1 && (
          <div className="shrink-0 px-5 py-3 border-t border-border/50 bg-secondary/10 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{data.total_pages}</span>
              <span className="ml-2 opacity-60">({data.total} orders)</span>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-border/50 bg-background/50 h-8">
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="border-border/50 bg-background/50 h-8">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <OrderDetailSheet
        orderId={selectedOrderId}
        open={selectedOrderId !== null}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  );
}
