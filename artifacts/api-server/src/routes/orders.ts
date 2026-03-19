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

function periodDates(period: string): { after: string; before: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  switch (period) {
    case "today":
      return { after: fmt(today) + "T00:00:00", before: fmt(tomorrow) + "T00:00:00" };
    case "yesterday": {
      const y = new Date(today); y.setDate(today.getDate() - 1);
      return { after: fmt(y) + "T00:00:00", before: fmt(today) + "T00:00:00" };
    }
    case "7days": {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { after: fmt(s) + "T00:00:00", before: fmt(tomorrow) + "T00:00:00" };
    }
    case "30days": {
      const s = new Date(today); s.setDate(today.getDate() - 29);
      return { after: fmt(s) + "T00:00:00", before: fmt(tomorrow) + "T00:00:00" };
    }
    case "thismonth": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { after: fmt(s) + "T00:00:00", before: fmt(tomorrow) + "T00:00:00" };
    }
    case "lastmonth": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 1);
      return { after: fmt(s) + "T00:00:00", before: fmt(e) + "T00:00:00" };
    }
    default:
      return { after: "2020-01-01T00:00:00", before: fmt(tomorrow) + "T00:00:00" };
  }
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

    let totalRevenue = 0;
    let completedRevenue = 0;
    let currencySymbol = "₦";

    // Fetch revenue from WC reports/sales endpoint
    try {
      const revenueResult = await wcGet("/reports/sales?period=custom&date_min=2020-01-01&date_max=2099-12-31");
      if (revenueResult.status === 200 && Array.isArray(revenueResult.data) && revenueResult.data.length > 0) {
        const row = revenueResult.data[0] as { total_sales?: string; net_sales?: string };
        totalRevenue = parseFloat(row?.total_sales ?? "0") || 0;
      }
    } catch {}

    // Fetch completed orders revenue by paging through completed orders
    try {
      let page = 1;
      let totalPages = 1;
      do {
        const r = await wcGet(`/orders?status=completed&per_page=100&page=${page}`);
        if (r.status !== 200 || !Array.isArray(r.data)) break;
        const orders = r.data as Array<{ total?: string; currency_symbol?: string }>;
        for (const o of orders) {
          completedRevenue += parseFloat(o.total ?? "0") || 0;
          if (!currencySymbol || currencySymbol === "₦") {
            currencySymbol = o.currency_symbol ?? "₦";
          }
        }
        totalPages = parseInt(r.headers.get("X-WP-TotalPages") ?? "1", 10);
        page++;
      } while (page <= totalPages && page <= 10);
    } catch {}

    // If still no currency symbol, try any order
    if (currencySymbol === "₦") {
      try {
        const firstOrder = await wcGet("/orders?per_page=1");
        if (firstOrder.status === 200 && Array.isArray(firstOrder.data) && firstOrder.data.length > 0) {
          const o = firstOrder.data[0] as { currency_symbol?: string };
          if (o.currency_symbol) currencySymbol = o.currency_symbol;
        }
      } catch {}
    }

    res.json({
      total_orders: totalOrders,
      pending: counts["pending"] ?? 0,
      processing: counts["processing"] ?? 0,
      completed: counts["completed"] ?? 0,
      cancelled: counts["cancelled"] ?? 0,
      refunded: counts["refunded"] ?? 0,
      on_hold: counts["on-hold"] ?? 0,
      failed: counts["failed"] ?? 0,
      total_revenue: totalRevenue.toFixed(2),
      completed_revenue: completedRevenue.toFixed(2),
      currency_symbol: currencySymbol,
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
    res.json({ id: null, number: null, date_created: null }); // don't return 500 for polling
  }
});

// GET /api/orders/reports — analytics data
router.get("/orders/reports", async (req: Request, res: Response) => {
  try {
    const { period = "7days" } = req.query as { period?: string };
    const { after, before } = periodDates(period);

    // Fetch all orders in range (up to 100 pages of 100)
    let allOrders: Array<{
      id: number;
      number: string;
      date_created: string;
      status: string;
      total: string;
      currency_symbol?: string;
      billing?: { city?: string; state?: string; country?: string };
    }> = [];
    let page = 1;
    let totalPages = 1;

    do {
      const qs = buildQS({ after, before, per_page: 100, page });
      const result = await wcGet(`/orders${qs}`);
      if (result.status !== 200 || !Array.isArray(result.data)) break;
      allOrders = allOrders.concat(result.data as typeof allOrders);
      totalPages = parseInt(result.headers.get("X-WP-TotalPages") ?? "1", 10);
      page++;
    } while (page <= totalPages && page <= 5); // cap at 5 pages (500 orders)

    const currencySymbol = allOrders[0]?.currency_symbol ?? "₦";

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    const ordersByStatus: Record<string, number> = {};
    const ordersByHour: Record<string, number> = {};

    for (let h = 0; h < 24; h++) ordersByHour[String(h)] = 0;

    for (const order of allOrders) {
      const date = order.date_created.split("T")[0];
      const hour = new Date(order.date_created).getHours();
      const revenue = parseFloat(order.total) || 0;

      revenueByDay[date] = (revenueByDay[date] ?? 0) + revenue;
      ordersByDay[date] = (ordersByDay[date] ?? 0) + 1;
      ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;
      ordersByHour[String(hour)] = (ordersByHour[String(hour)] ?? 0) + 1;
    }

    const totalRevenue = allOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const completedRevenue = allOrders
      .filter((o) => o.status === "completed")
      .reduce((s, o) => s + (parseFloat(o.total) || 0), 0);

    const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

    // Build sorted timeseries
    const days = Object.keys(revenueByDay).sort();
    const timeseries = days.map((day) => ({
      date: day,
      revenue: parseFloat(revenueByDay[day].toFixed(2)),
      orders: ordersByDay[day] ?? 0,
    }));

    const statusBreakdown = Object.entries(ordersByStatus).map(([status, count]) => ({
      status,
      count,
      revenue: parseFloat(
        allOrders
          .filter((o) => o.status === status)
          .reduce((s, o) => s + (parseFloat(o.total) || 0), 0)
          .toFixed(2)
      ),
    }));

    const hourlyDistribution = Object.entries(ordersByHour).map(([hour, count]) => ({
      hour: parseInt(hour),
      label: `${hour.padStart ? hour.padStart(2, "0") : hour}:00`,
      count,
    }));

    res.json({
      period,
      total_orders: allOrders.length,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      completed_revenue: parseFloat(completedRevenue.toFixed(2)),
      avg_order_value: parseFloat(avgOrderValue.toFixed(2)),
      currency_symbol: currencySymbol,
      timeseries,
      status_breakdown: statusBreakdown,
      hourly_distribution: hourlyDistribution,
    });
  } catch (err) {
    console.error("Reports error:", String(err));
    res.status(500).json({ error: "Failed to fetch reports data" });
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
      return res.status(result.status).json({ error: "WooCommerce API error", orders: [] });
    }

    const total = parseInt(result.headers.get("X-WP-Total") ?? "0", 10);
    const totalPages = parseInt(result.headers.get("X-WP-TotalPages") ?? "1", 10);

    res.json({ orders: result.data, total, total_pages: totalPages });
  } catch (err) {
    console.error("Orders list error:", String(err));
    res.status(500).json({ error: "Failed to fetch orders", orders: [] });
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
