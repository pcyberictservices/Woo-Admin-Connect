import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetOrdersResponse,
  GetOrderResponse,
  UpdateOrderResponse,
  GetOrderStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const WC_BASE_URL = "https://amabellefoods.com/wp-json/wc/v3";
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY!;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET!;

function wcAuth(): string {
  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");
  return `Basic ${credentials}`;
}

async function wcFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${WC_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: wcAuth(),
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  return fetch(url, { ...options, headers }) as unknown as Response;
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

router.get("/orders/stats", async (_req: Request, res: Response) => {
  try {
    const statuses = ["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"];
    const [allRes, ...statusResponses] = await Promise.all([
      (wcFetch("/orders?per_page=1") as unknown as Promise<globalThis.Response>),
      ...statuses.map(s => (wcFetch(`/orders?status=${s}&per_page=1`) as unknown as Promise<globalThis.Response>)),
    ]);

    const allHeaders = (allRes as globalThis.Response).headers;
    const totalOrders = parseInt(allHeaders.get("X-WP-Total") ?? "0", 10);

    const counts: Record<string, number> = {};
    for (let i = 0; i < statuses.length; i++) {
      const h = (statusResponses[i] as globalThis.Response).headers;
      counts[statuses[i]] = parseInt(h.get("X-WP-Total") ?? "0", 10);
    }

    const revenueRes = await (wcFetch("/reports/sales?period=all") as unknown as Promise<globalThis.Response>);
    let totalRevenue = "0";
    if (revenueRes.ok) {
      const revenueData = await revenueRes.json() as { total_sales?: string }[];
      totalRevenue = revenueData?.[0]?.total_sales ?? "0";
    }

    const stats = GetOrderStatsResponse.parse({
      total_orders: totalOrders,
      pending: counts["pending"] ?? 0,
      processing: counts["processing"] ?? 0,
      completed: counts["completed"] ?? 0,
      cancelled: counts["cancelled"] ?? 0,
      refunded: counts["refunded"] ?? 0,
      on_hold: counts["on-hold"] ?? 0,
      total_revenue: totalRevenue,
    });

    res.json(stats);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/orders", async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, per_page = 20 } = req.query as Record<string, string>;
    const qs = buildQueryString({ status, search, page: Number(page), per_page: Number(per_page) });
    const wcRes = await (wcFetch(`/orders${qs}`) as unknown as Promise<globalThis.Response>);

    if (!wcRes.ok) {
      const errText = await wcRes.text();
      console.error("WC error:", errText);
      return res.status(wcRes.status).json({ error: "WooCommerce API error" });
    }

    const total = parseInt(wcRes.headers.get("X-WP-Total") ?? "0", 10);
    const totalPages = parseInt(wcRes.headers.get("X-WP-TotalPages") ?? "1", 10);
    const orders = await wcRes.json();

    const response = GetOrdersResponse.parse({ orders, total, total_pages: totalPages });
    res.json(response);
  } catch (err) {
    console.error("Orders list error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const wcRes = await (wcFetch(`/orders/${id}`) as unknown as Promise<globalThis.Response>);

    if (!wcRes.ok) {
      return res.status(wcRes.status).json({ error: "Order not found" });
    }

    const order = await wcRes.json();
    const parsed = GetOrderResponse.parse(order);
    res.json(parsed);
  } catch (err) {
    console.error("Order detail error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.put("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const wcRes = await (wcFetch(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }) as unknown as Promise<globalThis.Response>);

    if (!wcRes.ok) {
      const errText = await wcRes.text();
      console.error("WC update error:", errText);
      return res.status(wcRes.status).json({ error: "Failed to update order" });
    }

    const order = await wcRes.json();
    const parsed = UpdateOrderResponse.parse(order);
    res.json(parsed);
  } catch (err) {
    console.error("Order update error:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
