import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useGetOrder, useUpdateOrder } from "@workspace/api-client-react";
import { OrderStatusBadge } from "./order-status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Mail, Phone, CreditCard, Save, Calendar,
  User, Package, Loader2, Hash, ShoppingBag
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

interface OrderDetailSheetProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-white leading-snug">{value}</span>
    </div>
  );
}

export function OrderDetailSheet({ orderId, open, onOpenChange }: OrderDetailSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [note, setNote] = useState("");

  const { data: order, isLoading } = useGetOrder(orderId!, {
    query: { enabled: !!orderId && open }
  });

  const updateOrder = useUpdateOrder({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Order updated",
          description: `Order #${order?.number} status → ${status.replace(/-/g, " ")}`,
          className: "border-emerald-500/30 bg-emerald-950/80 text-emerald-100",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      },
      onError: (error: any) => {
        toast({
          title: "Failed to update order",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  });

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setNote(order.customer_note || "");
    }
  }, [order]);

  const hasChanges = order && (status !== order.status || note !== (order.customer_note || ""));
  const sym = order?.currency_symbol || order?.currency || "₦";

  const billingAddress = [
    order?.billing?.address_1,
    order?.billing?.address_2,
    [order?.billing?.city, order?.billing?.state].filter(Boolean).join(", "),
    order?.billing?.postcode,
    order?.billing?.country,
  ].filter(Boolean).join("\n");

  const shippingAddress = [
    order?.shipping?.address_1,
    order?.shipping?.address_2,
    [order?.shipping?.city, order?.shipping?.state].filter(Boolean).join(", "),
    order?.shipping?.postcode,
    order?.shipping?.country,
  ].filter(Boolean).join("\n");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl bg-card/95 backdrop-blur-3xl border-l-border/50 p-0 flex flex-col shadow-2xl">
        {isLoading || !order ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm">Loading order...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Compact header */}
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/50 shrink-0 bg-background/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SheetTitle className="text-lg font-bold text-white">#{order.number}</SheetTitle>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <SheetDescription className="flex items-center gap-1.5 mt-1 text-xs">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {format(new Date(order.date_created), "MMM d, yyyy · h:mm a")}
                  </SheetDescription>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-xl font-bold text-white">
                    <span dangerouslySetInnerHTML={{ __html: sym }} />
                    {parseFloat(order.total).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-4 space-y-4">

                {/* Status update */}
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-3">
                  <p className="text-xs font-semibold text-white uppercase tracking-wide">Update Order</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="bg-background border-border/50 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Customer Note</Label>
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note..."
                        className="min-h-9 h-9 bg-background border-border/50 resize-none text-sm"
                      />
                    </div>
                  </div>
                  {hasChanges && (
                    <Button
                      onClick={() => orderId && updateOrder.mutate({ id: orderId, data: { status, customer_note: note } })}
                      disabled={updateOrder.isPending}
                      size="sm"
                      className="bg-primary text-primary-foreground h-8 text-sm w-full sm:w-auto"
                    >
                      {updateOrder.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                      Save Changes
                    </Button>
                  )}
                </div>

                {/* Order items */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-white">
                      Order Items ({order.line_items?.length ?? 0})
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
                    <div className="divide-y divide-border/50">
                      {order.line_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 p-3">
                          <div className="h-12 w-12 shrink-0 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center">
                            {item.image?.src ? (
                              <img src={item.image.src} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.sku ? `SKU: ${item.sku} · ` : ""}Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-white">
                              <span dangerouslySetInnerHTML={{ __html: sym }} />{parseFloat(item.total).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              <span dangerouslySetInnerHTML={{ __html: sym }} />{parseFloat(item.price ?? "0").toFixed(2)} ea
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="bg-secondary/20 p-3 border-t border-border/50 space-y-1.5 text-xs">
                      {[
                        { label: "Subtotal", val: order.subtotal },
                        { label: "Shipping", val: order.shipping_total },
                        { label: "Tax", val: order.total_tax },
                      ].filter(r => parseFloat(r.val ?? "0") > 0).map(row => (
                        <div key={row.label} className="flex justify-between text-muted-foreground">
                          <span>{row.label}</span>
                          <span><span dangerouslySetInnerHTML={{ __html: sym }} />{parseFloat(row.val ?? "0").toFixed(2)}</span>
                        </div>
                      ))}
                      <Separator className="my-1.5 bg-border/50" />
                      <div className="flex justify-between font-bold text-sm text-white">
                        <span>Total</span>
                        <span><span dangerouslySetInnerHTML={{ __html: sym }} />{parseFloat(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                  {/* Billing */}
                  <Card className="bg-transparent border-border/50">
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Billing</span>
                      </div>
                      <p className="text-sm font-semibold text-white">{order.billing.first_name} {order.billing.last_name}</p>
                      {order.billing.email && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span className="break-all">{order.billing.email}</span>
                        </div>
                      )}
                      {order.billing.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{order.billing.phone}</span>
                        </div>
                      )}
                      {billingAddress && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span className="whitespace-pre-line">{billingAddress}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Shipping + Payment */}
                  <div className="space-y-3">
                    {shippingAddress && (
                      <Card className="bg-transparent border-border/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Shipping</span>
                          </div>
                          <p className="text-sm font-semibold text-white">{order.shipping?.first_name} {order.shipping?.last_name}</p>
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span className="whitespace-pre-line">{shippingAddress}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-transparent border-border/50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Payment</span>
                        </div>
                        <p className="text-sm text-white font-medium">{order.payment_method_title || order.payment_method || "Unknown"}</p>
                        {order.transaction_id && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Hash className="h-3 w-3 shrink-0" />
                            <span className="font-mono truncate">{order.transaction_id}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
