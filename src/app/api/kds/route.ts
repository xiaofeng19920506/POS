import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    assertCan(session, "kds");

    const items = await prisma.orderItem.findMany({
      where: {
        status: "sent",
        order: { storeId: session.storeId, status: { in: ["sent", "open", "ready"] } },
      },
      include: {
        order: { include: { table: true } },
      },
      orderBy: { sentAt: "asc" },
    });

    return jsonOk({ items });
  } catch (e) {
    return jsonError(e);
  }
}
