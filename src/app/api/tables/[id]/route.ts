import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const table = await prisma.table.findFirst({
      where: { id, floorPlan: { storeId: session.storeId } },
    });
    if (!table) return jsonOk({ error: "桌台不存在" }, { status: 404 });

    const order = await prisma.order.findFirst({
      where: {
        tableId: id,
        storeId: session.storeId,
        status: { in: ["open", "sent", "ready"] },
      },
      include: {
        items: true,
        payments: true,
        staff: { select: { id: true, name: true, employeeId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ table, order });
  } catch (e) {
    return jsonError(e);
  }
}
