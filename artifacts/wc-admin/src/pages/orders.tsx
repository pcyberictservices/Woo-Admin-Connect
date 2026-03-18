import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Search, SlidersHorizontal, ShoppingCart, CheckCircle } from "lucide-react";
import { useGetOrders } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
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
import { Card, CardContent } from "@/components/ui/card";

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
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

// Track local optimistic statuses
const localStatuses: Record<number, string> = {};

export default function Orders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("any");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [localStatusMap, setLocalStatusMap] = useState<Record<number, string>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useGetOrders({
    page,
    per_page: 20,
    search: debouncedSearch || undefined,
    status: status !== "any" ? status : undefined,
  });

  const orders = data?.orders ?? [];

  const handleStatusChange = useCallback(async (orderId: number, newStatus: string, orderNumber: string) => {
    setUpdatingIds((prev) => new Set(prev).add(orderId));
    setLocalStatusMap((prev) => ({ ...prev, [orderId]: newStatus }));

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        toast({
          title: "Status updated",
          description: `Order #${orderNumber} → ${newStatus.replace(/-/g, " ")}`,
          className: "border-emerald-500/30 bg-emerald-950/80 text-emerald-100 backdrop-blur-xl",
        });
      } else {
        // Revert optimistic
        setLocalStatusMap((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        toast({ title: "Update failed", description: "Could not change order status.", variant: "destructive" });
      }
    } catch {
      setLocalStatusMap((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, [queryClient, toast]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-5rem)]">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Orders</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? "Loading..." : `${data?.total ?? 0} total orders`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-2 bg-card/40 backdrop-blur-md p-3 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders or customers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-background/50 border-border/50 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
            <SelectTrigger className="bg-background/50 border-border/50 h-9 text-sm w-full sm:w-[160px]">
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

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-lg flex flex-col">
        
        {/* DESKTOP TABLE (hidden on mobile) */}
        <div className="hidden md:flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-secondary/50 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="pl-5 w-[100px]">Order</TableHead>
                  <TableHead className="w-[130px]">Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[60px]">Items</TableHead>
                  <TableHead className="text-right w-[100px]">Total</TableHead>
                  <TableHead className="text-right pr-5 w-[150px]">Change Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="border-border/50">
                      <TableCell className="pl-5"><Skeleton className="h-4 w-14 bg-secondary" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-secondary" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36 bg-secondary" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full bg-secondary" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-5 ml-auto bg-secondary" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-14 ml-auto bg-secondary" /></TableCell>
                      <TableCell className="text-right pr-5"><Skeleton className="h-7 w-28 ml-auto bg-secondary rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="h-[200px] text-center text-muted-foreground text-sm">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      Failed to load orders.
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="h-[200px] text-center text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-medium">No orders found</p>
                      {(search || status !== "any") && (
                        <Button variant="outline" size="sm" className="mt-2 border-border/50 h-8 text-xs"
                          onClick={() => { setSearch(""); setStatus("any"); }}>
                          Clear filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const currentStatus = localStatusMap[order.id] ?? order.status;
                    const isUpdating = updatingIds.has(order.id);
                    return (
                      <TableRow
                        key={order.id}
                        className="group border-border/50 hover:bg-white/[0.025] transition-colors cursor-pointer"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <TableCell className="pl-5 font-semibold text-white text-sm">
                          <span className="group-hover:text-primary transition-colors">#{order.number}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          <div>{format(new Date(order.date_created), "MMM d, yyyy")}</div>
                          <div className="opacity-60">{format(new Date(order.date_created), "h:mm a")}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-white">{order.billing.first_name} {order.billing.last_name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">{order.billing.email}</div>
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={currentStatus} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {order.line_items.reduce((acc, item) => acc + item.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-white text-sm">
                          <span dangerouslySetInnerHTML={{ __html: order.currency_symbol ?? order.currency }} />
                          {parseFloat(order.total).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={currentStatus}
                            disabled={isUpdating}
                            onValueChange={(v) => handleStatusChange(order.id, v, order.number)}
                          >
                            <SelectTrigger className="w-[130px] h-7 text-xs bg-secondary/40 border-border/50 ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_ACTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination - desktop */}
          {!isLoading && data && data.total_pages > 1 && (
            <div className="shrink-0 px-5 py-3 border-t border-border/50 bg-secondary/10 flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">
                Page <span className="text-white font-medium">{page}</span> / <span className="text-white font-medium">{data.total_pages}</span>
                <span className="ml-2 opacity-60">({data.total} total)</span>
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-border/50 bg-background/50 h-8 text-xs">Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="border-border/50 bg-background/50 h-8 text-xs">Next</Button>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE CARD VIEW (hidden on desktop) */}
        <div className="flex md:hidden flex-col flex-1 min-h-0 overflow-auto p-3 gap-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16 bg-secondary" />
                    <Skeleton className="h-5 w-20 rounded-full bg-secondary" />
                  </div>
                  <Skeleton className="h-4 w-36 bg-secondary" />
                  <Skeleton className="h-4 w-28 bg-secondary" />
                  <Skeleton className="h-8 w-full bg-secondary rounded-lg" />
                </CardContent>
              </Card>
            ))
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No orders found</p>
            </div>
          ) : (
            orders.map((order) => {
              const currentStatus = localStatusMap[order.id] ?? order.status;
              const isUpdating = updatingIds.has(order.id);
              return (
                <Card
                  key={order.id}
                  className="bg-card/50 border-border/50 hover:bg-card/70 transition-colors cursor-pointer active:scale-[0.99]"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-base">#{order.number}</span>
                      <OrderStatusBadge status={currentStatus} />
                    </div>

                    {/* Customer */}
                    <div>
                      <p className="text-sm font-medium text-white">{order.billing.first_name} {order.billing.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.billing.email}</p>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(order.date_created), "MMM d, yyyy · h:mm a")}</span>
                      <span className="font-semibold text-white text-sm">
                        <span dangerouslySetInnerHTML={{ __html: order.currency_symbol ?? order.currency }} />
                        {parseFloat(order.total).toFixed(2)}
                      </span>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={currentStatus}
                        disabled={isUpdating}
                        onValueChange={(v) => handleStatusChange(order.id, v, order.number)}
                      >
                        <SelectTrigger className="flex-1 h-9 text-xs bg-secondary/40 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ACTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 border-border/50 bg-secondary/20 text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); }}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Pagination - mobile */}
          {!isLoading && data && data.total_pages > 1 && (
            <div className="flex items-center justify-between py-2 px-1">
              <span className="text-xs text-muted-foreground">Page {page}/{data.total_pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-border/50 h-8 text-xs">Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="border-border/50 h-8 text-xs">Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <OrderDetailSheet
        orderId={selectedOrderId}
        open={selectedOrderId !== null}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  );
}
