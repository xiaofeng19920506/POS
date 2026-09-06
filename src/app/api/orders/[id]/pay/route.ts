import { PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { sumItems } from "@/lib/money";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    assertCan(session, "order");
    const { id } = await ctx.params;
    const body = z
      .object({
        method: z.nativeEnum(PaymentMethod),
        clearTo: z.enum(["dirty", "available"]).default("dirty"),
      })
      .parse(await req.json());

    const order = await prisma.order.findFirst({
      where: { id, storeId: session.storeId },
      include: { items: true },
    });
    if (!order) return jsonOk({ error: "订单不存在" }, { status: 404 });
    if (order.status === "paid" || order.status === "void") {
      return jsonOk({ error: "订单已关闭" }, { status: 400 });
    }

    const subtotal = sumItems(order.items);
    const total = Math.max(0, subtotal - order.discountCents);

    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: "billing" },
      });
    }

    await prisma.payment.create({
      data: {
        orderId: id,
        method: body.method,
        amountCents: total,
      },
    });

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "paid", paidAt: new Date() },
      include: { items: true, payments: true, table: true },
    });

    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: body.clearTo },
      });
    }

    emitPos("orders");
    emitPos("tables");
    return jsonOk({ order: updated, totalCents: total });
  } catch (e) {
    return jsonError(e);
  }
}
