import { useState } from "react";
import { format } from "date-fns";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
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
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Orders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data, isLoading } = useGetOrders({
    page,
    per_page: 20,
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
  });

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Orders</h2>
          <p className="text-muted-foreground">Manage and track all customer orders.</p>
        </div>
      </div>

      <div className="shrink-0 flex flex-col sm:flex-row gap-4 items-center bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={status} 
            onValueChange={(val) => { setStatus(val); setPage(1); }}
          >
            <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-secondary/50 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[120px] pl-6">Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right pr-6">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell className="pl-6"><Skeleton className="h-5 w-16 bg-secondary" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 bg-secondary" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32 bg-secondary" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full bg-secondary" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto bg-secondary" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-5 w-16 ml-auto bg-secondary" /></TableCell>
                  </TableRow>
                ))
              ) : data?.orders.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-lg font-medium">No orders found</p>
                      <p className="text-sm">Try changing your filters or search term.</p>
                      {(search || status !== "all") && (
                        <Button 
                          variant="outline" 
                          className="mt-4 border-border/50"
                          onClick={() => { setSearch(""); setStatus("all"); }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.orders.map((order, i) => (
                  <TableRow 
                    key={order.id} 
                    className="group cursor-pointer hover:bg-white/[0.02] border-border/50 transition-colors"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <TableCell className="font-medium text-white pl-6">
                      <span className="group-hover:text-primary transition-colors">#{order.number}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.date_created), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-white">
                        {order.billing.first_name} {order.billing.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.billing.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {order.line_items.reduce((acc, item) => acc + item.quantity, 0)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-white pr-6">
                      <span dangerouslySetInnerHTML={{ __html: order.currency_symbol || order.currency }} />
                      {order.total}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {!isLoading && data && data.total_pages > 1 && (
          <div className="shrink-0 p-4 border-t border-border/50 bg-secondary/20 flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Showing page <span className="font-medium text-white">{page}</span> of <span className="font-medium text-white">{data.total_pages}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-border/50 bg-background/50 hover:bg-background"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="border-border/50 bg-background/50 hover:bg-background"
              >
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
