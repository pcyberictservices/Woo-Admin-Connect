import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetOrder, 
  useUpdateOrder,
  getGetOrdersQueryKey
} from "@workspace/api-client-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Mail, Phone, CreditCard, Save, Calendar, User, Package, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending payment" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On hold" },
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
          title: "Order updated successfully",
          description: `Order #${order?.number} status changed to ${status}.`,
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

  const handleSave = () => {
    if (!orderId) return;
    updateOrder.mutate({
      id: orderId,
      data: {
        status,
        customer_note: note
      }
    });
  };

  const hasChanges = order && (status !== order.status || note !== (order.customer_note || ""));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl bg-card/95 backdrop-blur-3xl border-l-border/50 p-0 flex flex-col shadow-2xl">
        {isLoading || !order ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading order details...</p>
            </div>
          </div>
        ) : (
          <>
            <SheetHeader className="px-6 py-6 border-b border-border/50 shrink-0 bg-background/50">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-2xl flex items-center gap-3">
                    Order #{order.number}
                    <OrderStatusBadge status={order.status} />
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(order.date_created), "PPpp")}
                  </SheetDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    <span dangerouslySetInnerHTML={{ __html: order.currency_symbol || order.currency }} />
                    {order.total}
                  </p>
                </div>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6 py-6">
              <div className="space-y-8">
                {/* Actions & Status */}
                <Card className="bg-secondary/30 border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Update Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="bg-background border-border/50">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Customer Note</Label>
                        <Textarea 
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Add a note for the customer..."
                          className="min-h-10 bg-background border-border/50 resize-none"
                        />
                      </div>
                    </div>
                    {hasChanges && (
                      <div className="flex justify-end pt-2">
                        <Button 
                          onClick={handleSave} 
                          disabled={updateOrder.isPending}
                          className="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        >
                          {updateOrder.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Line Items */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    Order Items
                  </h3>
                  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <div className="divide-y divide-border/50">
                      {order.line_items.map((item) => (
                        <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                          <div className="h-16 w-16 shrink-0 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center">
                            {item.image?.src ? (
                              <img src={item.image.src} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.sku ? `SKU: ${item.sku} • ` : ''}Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">
                              <span dangerouslySetInnerHTML={{ __html: order.currency_symbol || order.currency }} />
                              {item.total}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span dangerouslySetInnerHTML={{ __html: order.currency_symbol || order.currency }} />
                              {item.price} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order Totals Summary */}
                    <div className="bg-secondary/20 p-4 border-t border-border/50 space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span><span dangerouslySetInnerHTML={{ __html: order.currency_symbol || order.currency }} />{order.subtotal || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Shipping</span>
                        <span><span dangerouslySetInnerHTML={{ __html: order.currency_symbol || order.currency }} />{order.shipping_total || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax</span>
                        <span><span dangerouslySetInnerHTML={{ __html: order.currency_symbol || order.currency }} />{order.total_tax || "0.00"}</span>
                      </div>
                      <Separator className="my-2 bg-border/50" />
                      <div className="flex justify-between font-bold text-base text-white">
                        <span>Total</span>
                        <span><span dangerouslySetInnerHTML={{ __html: order.currency_symbol || order.currency }} />{order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                  {/* Billing */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Billing Details
                    </h3>
                    <Card className="bg-transparent border-border/50">
                      <CardContent className="p-4 space-y-3 text-sm">
                        <div className="font-medium text-white text-base">
                          {order.billing.first_name} {order.billing.last_name}
                        </div>
                        
                        <div className="flex items-start gap-3 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="break-all">{order.billing.email}</span>
                        </div>
                        
                        {order.billing.phone && (
                          <div className="flex items-start gap-3 text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{order.billing.phone}</span>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3 text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <p>{order.billing.address_1}</p>
                            {order.billing.address_2 && <p>{order.billing.address_2}</p>}
                            <p>{order.billing.city}, {order.billing.state} {order.billing.postcode}</p>
                            <p>{order.billing.country}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Shipping & Payment */}
                  <div className="space-y-6">
                    {order.shipping && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Package className="h-4 w-4" /> Shipping Details
                        </h3>
                        <Card className="bg-transparent border-border/50">
                          <CardContent className="p-4 space-y-3 text-sm">
                            <div className="font-medium text-white text-base">
                              {order.shipping.first_name} {order.shipping.last_name}
                            </div>
                            <div className="flex items-start gap-3 text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <p>{order.shipping.address_1}</p>
                                {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
                                <p>{order.shipping.city}, {order.shipping.state} {order.shipping.postcode}</p>
                                <p>{order.shipping.country}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Payment Method
                      </h3>
                      <Card className="bg-transparent border-border/50">
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-white">
                            {order.payment_method_title || order.payment_method || "Unknown"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
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
