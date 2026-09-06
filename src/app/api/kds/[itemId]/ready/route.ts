import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  try {
    const session = await requireSession();
    assertCan(session, "kds");
    const { itemId } = await ctx.params;

    const item = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: { storeId: session.storeId },
      },
    });
    if (!item) return jsonOk({ error: "菜品不存在" }, { status: 404 });

    await prisma.orderItem.update({
      where: { id: itemId },
      data: { status: "ready", readyAt: new Date() },
    });

    const remaining = await prisma.orderItem.count({
      where: {
        orderId: item.orderId,
        status: { in: ["pending", "sent"] },
      },
    });

    if (remaining === 0) {
      await prisma.order.update({
        where: { id: item.orderId },
        data: { status: "ready" },
      });
    }

    emitPos("kds");
    emitPos("orders");
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
