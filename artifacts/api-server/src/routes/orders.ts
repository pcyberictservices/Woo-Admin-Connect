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

async function wcPut(path: string, body: unknown): Promise<{ data: unknown; status: number }> {
  const res = await fetch(`${WC_BASE_URL}${path}`, {
    method: "PUT",
    headers: { Authorization: wcAuth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { data, status: res.status };
}

function buildQS(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  return entries.length ? "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&") : "";
}

// GET /api/orders/stats
router.get("/orders/stats", async (_req: Request, res: Response) => {
  try {
    const statuses = ["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"];
    const [allResult, ...statusResults] = await Promise.all([
      wcGet("/orders?per_page=1"),
      ...statuses.map((s) => wcGet(`/orders?status=${s}&per_page=1`)),
    ]);

    const totalOrders = parseInt(allResult.headers.get("X-WP-Total") ?? "0", 10);
    const counts: Record<string, number> = {};
    for (let i = 0; i < statuses.length; i++) {
      counts[statuses[i]] = parseInt(statusResults[i].headers.get("X-WP-Total") ?? "0", 10);
    }

    let totalRevenue = "0";
    try {
      const revenueResult = await wcGet("/reports/sales?period=custom&date_min=2020-01-01&date_max=2099-12-31");
      if (revenueResult.status === 200 && Array.isArray(revenueResult.data)) {
        totalRevenue = (revenueResult.data as Array<{ total_sales?: string }>)[0]?.total_sales ?? "0";
      }
    } catch {
      // revenue optional
    }

    res.json({
      total_orders: totalOrders,
      pending: counts["pending"] ?? 0,
      processing: counts["processing"] ?? 0,
      completed: counts["completed"] ?? 0,
      cancelled: counts["cancelled"] ?? 0,
      refunded: counts["refunded"] ?? 0,
      on_hold: counts["on-hold"] ?? 0,
      total_revenue: totalRevenue,
    });
  } catch (err) {
    console.error("Stats error:", String(err));
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/orders/latest — for polling new orders
router.get("/orders/latest", async (_req: Request, res: Response) => {
  try {
    const result = await wcGet("/orders?per_page=1&orderby=date&order=desc");
    if (result.status !== 200 || !Array.isArray(result.data) || result.data.length === 0) {
      return res.json({ id: null, number: null, date_created: null });
    }
    const latest = (result.data as Array<{ id: number; number: string; date_created: string }>)[0];
    res.json({ id: latest.id, number: latest.number, date_created: latest.date_created });
  } catch (err) {
    console.error("Latest order error:", String(err));
    res.status(500).json({ error: "Failed" });
  }
});

// GET /api/orders
router.get("/orders", async (req: Request, res: Response) => {
  try {
    const { status, search, page = "1", per_page = "20" } = req.query as Record<string, string>;
    const qs = buildQS({ status: status || undefined, search: search || undefined, page: Number(page), per_page: Number(per_page) });
    const result = await wcGet(`/orders${qs}`);

    if (result.status !== 200) {
      console.error("WC orders error:", result.status, JSON.stringify(result.data));
      return res.status(result.status).json({ error: "WooCommerce API error" });
    }

    const total = parseInt(result.headers.get("X-WP-Total") ?? "0", 10);
    const totalPages = parseInt(result.headers.get("X-WP-TotalPages") ?? "1", 10);

    res.json({ orders: result.data, total, total_pages: totalPages });
  } catch (err) {
    console.error("Orders list error:", String(err));
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// GET /api/orders/:id
router.get("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await wcGet(`/orders/${id}`);
    if (result.status !== 200) return res.status(result.status).json({ error: "Order not found" });
    res.json(result.data);
  } catch (err) {
    console.error("Order detail error:", String(err));
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// PUT /api/orders/:id
router.put("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await wcPut(`/orders/${id}`, req.body);
    if (result.status !== 200) {
      console.error("WC update error:", result.status, JSON.stringify(result.data));
      return res.status(result.status).json({ error: "Failed to update order" });
    }
    res.json(result.data);
  } catch (err) {
    console.error("Order update error:", String(err));
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
