import { startOfDay, endOfDay } from "date-fns";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { sumItems } from "@/lib/money";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "reports");
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("date")
      ? new Date(searchParams.get("date")!)
      : new Date();

    const from = startOfDay(day);
    const to = endOfDay(day);

    const orders = await prisma.order.findMany({
      where: {
        storeId: session.storeId,
        status: "paid",
        paidAt: { gte: from, lte: to },
      },
      include: { items: true, payments: true, table: true },
    });

    const revenue = orders.reduce((sum, o) => {
      const sub = sumItems(o.items);
      return sum + Math.max(0, sub - o.discountCents);
    }, 0);

    const itemCounts = new Map<string, { name: string; qty: number; cents: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        if (item.status === "void") continue;
        const prev = itemCounts.get(item.name) ?? {
          name: item.name,
          qty: 0,
          cents: 0,
        };
        prev.qty += item.quantity;
        prev.cents += item.unitCents * item.quantity;
        itemCounts.set(item.name, prev);
      }
    }

    const topItems = [...itemCounts.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const byMethod = { cash: 0, card: 0, other: 0 };
    for (const o of orders) {
      for (const p of o.payments) {
        byMethod[p.method] += p.amountCents;
      }
    }

    return jsonOk({
      date: from.toISOString(),
      orderCount: orders.length,
      revenueCents: revenue,
      avgTicketCents: orders.length ? Math.round(revenue / orders.length) : 0,
      byMethod,
      topItems,
    });
  } catch (e) {
    return jsonError(e);
  }
}
