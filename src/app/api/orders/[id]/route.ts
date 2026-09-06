import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const order = await prisma.order.findFirst({
      where: { id, storeId: session.storeId },
      include: { items: true, payments: true, table: true },
    });
    if (!order) return jsonOk({ error: "订单不存在" }, { status: 404 });
    return jsonOk({ order });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    assertCan(session, "order");
    const { id } = await ctx.params;
    const body = await req.json();

    const order = await prisma.order.findFirst({
      where: { id, storeId: session.storeId },
    });
    if (!order) return jsonOk({ error: "订单不存在" }, { status: 404 });

    if (body.discountCents != null) {
      assertCan(session, "discount");
      await prisma.auditLog.create({
        data: {
          staffId: session.id,
          action: "discount",
          detail: `order=${id} discount=${body.discountCents}`,
        },
      });
    }

    if (body.status === "void") {
      assertCan(session, "void");
      await prisma.auditLog.create({
        data: {
          staffId: session.id,
          action: "void_order",
          detail: `order=${id}`,
        },
      });
      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: "available" },
        });
        emitPos("tables");
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        discountCents: body.discountCents ?? undefined,
        note: body.note ?? undefined,
        guestCount: body.guestCount ?? undefined,
        status: body.status ?? undefined,
      },
      include: { items: true, payments: true, table: true },
    });
    emitPos("orders");
    return jsonOk({ order: updated });
  } catch (e) {
    return jsonError(e);
  }
}
