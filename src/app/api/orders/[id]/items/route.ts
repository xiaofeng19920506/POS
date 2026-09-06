import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1).default(1),
  modifiers: z
    .array(z.object({ name: z.string(), priceCents: z.number().int() }))
    .default([]),
  note: z.string().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    assertCan(session, "order");
    const { id } = await ctx.params;
    const body = itemSchema.parse(await req.json());

    const order = await prisma.order.findFirst({
      where: { id, storeId: session.storeId, status: { in: ["open", "sent", "ready"] } },
    });
    if (!order) return jsonOk({ error: "订单不存在或已关闭" }, { status: 404 });

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: body.menuItemId },
    });
    if (!menuItem || !menuItem.active) {
      return jsonOk({ error: "菜品不可用" }, { status: 400 });
    }

    const modExtra = body.modifiers.reduce((s, m) => s + m.priceCents, 0);
    const item = await prisma.orderItem.create({
      data: {
        orderId: id,
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitCents: menuItem.priceCents + modExtra,
        quantity: body.quantity,
        modifiersJson: JSON.stringify(body.modifiers),
        note: body.note ?? null,
        status: "pending",
      },
    });

    if (order.status === "ready") {
      await prisma.order.update({ where: { id }, data: { status: "open" } });
    }

    emitPos("orders");
    return jsonOk({ item });
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
    const { id: orderId } = await ctx.params;
    const body = await req.json();
    const itemId = body.itemId as string;

    const item = await prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });
    if (!item) return jsonOk({ error: "菜品不存在" }, { status: 404 });

    if (body.void) {
      assertCan(session, "void");
      await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: "void" },
      });
      await prisma.auditLog.create({
        data: {
          staffId: session.id,
          action: "void_item",
          detail: `order=${orderId} item=${itemId}`,
        },
      });
    } else {
      await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          quantity: body.quantity ?? undefined,
          note: body.note ?? undefined,
        },
      });
    }

    emitPos("orders");
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    return jsonOk({ order });
  } catch (e) {
    return jsonError(e);
  }
}
