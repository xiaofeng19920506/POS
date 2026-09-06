import { TableStatus } from "@prisma/client";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { allowedStatusTransitions } from "@/lib/table-status";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    assertCan(session, "floorView");
    const { id } = await ctx.params;
    const body = z
      .object({ status: z.nativeEnum(TableStatus) })
      .parse(await req.json());

    const table = await prisma.table.findFirst({
      where: { id, floorPlan: { storeId: session.storeId } },
    });
    if (!table) return jsonOk({ error: "桌台不存在" }, { status: 404 });

    const allowed = allowedStatusTransitions[table.status];
    if (!allowed.includes(body.status)) {
      return jsonOk(
        { error: `无法从 ${table.status} 切换到 ${body.status}` },
        { status: 400 },
      );
    }

    const updated = await prisma.table.update({
      where: { id },
      data: { status: body.status },
    });
    emitPos("tables");
    return jsonOk({ table: updated });
  } catch (e) {
    return jsonError(e);
  }
}
