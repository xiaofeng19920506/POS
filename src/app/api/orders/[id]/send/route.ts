import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    assertCan(session, "order");
    const { id } = await ctx.params;

    const order = await prisma.order.findFirst({
      where: { id, storeId: session.storeId },
      include: { items: true },
    });
    if (!order) return jsonOk({ error: "订单不存在" }, { status: 404 });

    const pending = order.items.filter((i) => i.status === "pending");
    if (!pending.length) {
      return jsonOk({ error: "没有待送厨的菜品" }, { status: 400 });
    }

    const now = new Date();
    await prisma.orderItem.updateMany({
      where: { id: { in: pending.map((i) => i.id) } },
      data: { status: "sent", sentAt: now },
    });

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "sent", sentAt: order.sentAt ?? now },
      include: { items: true, payments: true, table: true },
    });

    emitPos("orders");
    emitPos("kds");
    return jsonOk({ order: updated });
  } catch (e) {
    return jsonError(e);
  }
}
