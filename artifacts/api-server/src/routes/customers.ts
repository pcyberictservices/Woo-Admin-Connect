import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const WC_BASE_URL = "https://amabellefoods.com/wp-json/wc/v3";

function wcAuth(): string {
  const key = process.env.WC_CONSUMER_KEY ?? "";
  const secret = process.env.WC_CONSUMER_SECRET ?? "";
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

async function wcGet(path: string): Promise<{ data: unknown; headers: Headers; status: number }> {
  const res = await fetch(`${WC_BASE_URL}${path}`, {
    headers: { Authorization: wcAuth(), "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => null);
  return { data, headers: res.headers, status: res.status };
}

// GET /api/customers
router.get("/customers", async (req: Request, res: Response) => {
  try {
    const { search, page = "1", per_page = "20" } = req.query as Record<string, string>;
    const qs = new URLSearchParams({ page, per_page });
    if (search) qs.set("search", search);

    const result = await wcGet(`/customers?${qs.toString()}`);
    if (result.status !== 200) {
      return res.status(result.status).json({ error: "WooCommerce API error", customers: [] });
    }

    const total = parseInt(result.headers.get("X-WP-Total") ?? "0", 10);
    const totalPages = parseInt(result.headers.get("X-WP-TotalPages") ?? "1", 10);

    res.json({ customers: result.data, total, total_pages: totalPages });
  } catch (err) {
    console.error("Customers list error:", String(err));
    res.status(500).json({ error: "Failed to fetch customers", customers: [] });
  }
});

// GET /api/customers/:id — customer detail with orders
router.get("/customers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [customerResult, ordersResult] = await Promise.all([
      wcGet(`/customers/${id}`),
      wcGet(`/orders?customer=${id}&per_page=100`),
    ]);

    if (customerResult.status !== 200) {
      return res.status(customerResult.status).json({ error: "Customer not found" });
    }

    const orders = ordersResult.status === 200 && Array.isArray(ordersResult.data)
      ? ordersResult.data as Array<{ id: number; number: string; status: string; total: string; date_created: string; line_items: Array<{ name: string; quantity: number; total: string }> }>
      : [];

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const completedOrders = orders.filter(o => o.status === "completed").length;
    const failedOrders = orders.filter(o => o.status === "failed").length;
    const onHoldOrders = orders.filter(o => o.status === "on-hold").length;
    const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
    const processingOrders = orders.filter(o => o.status === "processing").length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;

    const productCounts: Record<string, { name: string; quantity: number; total: number }> = {};
    for (const order of orders) {
      for (const item of order.line_items ?? []) {
        const key = item.name;
        if (!productCounts[key]) productCounts[key] = { name: item.name, quantity: 0, total: 0 };
        productCounts[key].quantity += item.quantity;
        productCounts[key].total += parseFloat(item.total) || 0;
      }
    }
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    res.json({
      customer: customerResult.data,
      orders,
      stats: {
        total_orders: totalOrders,
        total_spent: totalSpent.toFixed(2),
        completed: completedOrders,
        failed: failedOrders,
        on_hold: onHoldOrders,
        cancelled: cancelledOrders,
        processing: processingOrders,
        pending: pendingOrders,
      },
      top_products: topProducts,
    });
  } catch (err) {
    console.error("Customer detail error:", String(err));
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

export default router;
