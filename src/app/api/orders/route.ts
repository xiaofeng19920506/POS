import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "order");
    const body = z
      .object({
        tableId: z.string(),
        guestCount: z.number().int().min(1).default(1),
      })
      .parse(await req.json());

    const table = await prisma.table.findFirst({
      where: { id: body.tableId, floorPlan: { storeId: session.storeId } },
    });
    if (!table) return jsonOk({ error: "桌台不存在" }, { status: 404 });

    const orderInclude = {
      items: true,
      payments: true,
      staff: { select: { id: true, name: true, employeeId: true } },
    } as const;

    let order = await prisma.order.findFirst({
      where: {
        tableId: body.tableId,
        status: { in: ["open", "sent", "ready"] },
      },
      include: orderInclude,
    });

    if (!order) {
      order = await prisma.order.create({
        data: {
          storeId: session.storeId,
          tableId: body.tableId,
          staffId: session.id,
          guestCount: body.guestCount,
          status: "open",
        },
        include: orderInclude,
      });
      await prisma.table.update({
        where: { id: body.tableId },
        data: { status: "occupied" },
      });
      emitPos("tables");
      emitPos("orders");
    } else {
      // Keep seated table occupied while ordering; system owns status
      if (table.status === "available" || table.status === "dirty" || table.status === "reserved") {
        await prisma.table.update({
          where: { id: body.tableId },
          data: { status: "occupied" },
        });
        emitPos("tables");
      }
    }

    return jsonOk({ order });
  } catch (e) {
    return jsonError(e);
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId");
    const status = searchParams.get("status");

    const orders = await prisma.order.findMany({
      where: {
        storeId: session.storeId,
        ...(tableId ? { tableId } : {}),
        ...(status ? { status: status as "open" } : {}),
      },
      include: { items: true, payments: true, table: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonOk({ orders });
  } catch (e) {
    return jsonError(e);
  }
}
