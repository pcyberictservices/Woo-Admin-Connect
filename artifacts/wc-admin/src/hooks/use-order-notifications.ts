import { useEffect, useRef, useState, useCallback } from "react";

export interface NewOrderNotification {
  id: number;
  number: string;
  date_created: string;
  seenAt: number;
}

const POLL_INTERVAL = 30_000; // 30 seconds
const STORAGE_KEY = "wc_last_order_id";

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const times = [0, 0.15, 0.3];
    const freqs = [880, 1100, 1320];
    times.forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + t);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.35);
    });
  } catch {
    // AudioContext may be blocked
  }
}

function showBrowserNotification(number: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("🛒 New Order Received!", {
      body: `Order #${number} has just been placed on Amabelle Foods.`,
      icon: "/favicon.ico",
      tag: `order-${number}`,
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        new Notification("🛒 New Order Received!", {
          body: `Order #${number} has just been placed on Amabelle Foods.`,
          icon: "/favicon.ico",
        });
      }
    });
  }
}

export function useOrderNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NewOrderNotification[]>([]);
  const lastIdRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => setNotifications([]), []);

  useEffect(() => {
    if (!enabled) return;

    // Request notification permission early
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const poll = async () => {
      try {
        const res = await fetch("/api/orders/latest", { credentials: "include" });
        if (!res.ok) return;
        const latest = await res.json() as { id: number | null; number: string; date_created: string };
        if (!latest.id) return;

        if (!initializedRef.current) {
          // First poll — just set the baseline from localStorage or current
          const stored = localStorage.getItem(STORAGE_KEY);
          lastIdRef.current = stored ? parseInt(stored, 10) : latest.id;
          localStorage.setItem(STORAGE_KEY, String(latest.id));
          initializedRef.current = true;
          return;
        }

        if (lastIdRef.current !== null && latest.id > lastIdRef.current) {
          // New order detected!
          playNotificationSound();
          showBrowserNotification(latest.number);
          setNotifications((prev) => [
            { id: latest.id!, number: latest.number, date_created: latest.date_created, seenAt: Date.now() },
            ...prev.slice(0, 9),
          ]);
          lastIdRef.current = latest.id;
          localStorage.setItem(STORAGE_KEY, String(latest.id));
        }
      } catch {
        // ignore network errors
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [enabled]);

  return { notifications, dismiss, dismissAll };
}
