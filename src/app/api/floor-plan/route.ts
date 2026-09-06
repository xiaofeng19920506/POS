import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { storeId: session.storeId },
      include: {
        tables: {
          orderBy: { sortOrder: "asc" },
          include: {
            orders: {
              where: { status: { in: ["open", "sent", "ready"] } },
              take: 1,
              orderBy: { createdAt: "desc" },
              include: {
                staff: { select: { id: true, name: true, employeeId: true } },
              },
            },
          },
        },
      },
    });
    return jsonOk({ floorPlan });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "floorEditLayout");
    const body = await req.json();
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { storeId: session.storeId },
    });
    if (!floorPlan) {
      return jsonOk({ error: "未找到桌台布局" }, { status: 404 });
    }

    if (body.name || body.aspectW || body.aspectH) {
      await prisma.floorPlan.update({
        where: { id: floorPlan.id },
        data: {
          name: body.name ?? undefined,
          aspectW: body.aspectW ?? undefined,
          aspectH: body.aspectH ?? undefined,
        },
      });
    }

    if (Array.isArray(body.tables)) {
      const existing = await prisma.table.findMany({
        where: { floorPlanId: floorPlan.id },
      });
      const incomingIds = new Set(
        body.tables.filter((t: { id?: string }) => t.id).map((t: { id: string }) => t.id),
      );
      const toDelete = existing.filter((t) => !incomingIds.has(t.id));
      if (toDelete.length) {
        await prisma.table.deleteMany({
          where: { id: { in: toDelete.map((t) => t.id) } },
        });
      }

      for (const [i, t] of body.tables.entries()) {
        const data = {
          name: String(t.name || `桌${i + 1}`),
          number: String(t.number || String(i + 1)),
          xPct: Number(t.xPct),
          yPct: Number(t.yPct),
          wPct: Number(t.wPct ?? 8),
          hPct: Number(t.hPct ?? 12),
          shape: t.shape === "square" ? "square" : "round",
          seats: Number(t.seats ?? 4),
          sortOrder: i,
        } as const;

        if (t.id && existing.some((e) => e.id === t.id)) {
          await prisma.table.update({
            where: { id: t.id },
            data,
          });
        } else {
          await prisma.table.create({
            data: {
              floorPlanId: floorPlan.id,
              ...data,
            },
          });
        }
      }
    }

    const updated = await prisma.floorPlan.findUnique({
      where: { id: floorPlan.id },
      include: { tables: { orderBy: { sortOrder: "asc" } } },
    });
    emitPos("tables");
    return jsonOk({ floorPlan: updated });
  } catch (e) {
    return jsonError(e);
  }
}
