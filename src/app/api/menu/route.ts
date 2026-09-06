import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    const categories = await prisma.category.findMany({
      where: { storeId: session.storeId },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            modifiers: { include: { options: true } },
          },
        },
      },
    });
    return jsonOk({ categories });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "menuAdmin");
    const body = await req.json();

    if (body.type === "category") {
      const count = await prisma.category.count({ where: { storeId: session.storeId } });
      const category = await prisma.category.create({
        data: {
          storeId: session.storeId,
          name: String(body.name || "新分类"),
          sortOrder: count,
        },
      });
      emitPos("menu");
      return jsonOk({ category });
    }

    if (body.type === "item") {
      const item = await prisma.menuItem.create({
        data: {
          categoryId: body.categoryId,
          name: String(body.name || "新菜品"),
          description: body.description ?? null,
          priceCents: Number(body.priceCents ?? 0),
          active: body.active !== false,
        },
      });
      emitPos("menu");
      return jsonOk({ item });
    }

    return jsonOk({ error: "无效请求" }, { status: 400 });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "menuAdmin");
    const body = await req.json();

    if (body.type === "category") {
      const category = await prisma.category.update({
        where: { id: body.id },
        data: {
          name: body.name ?? undefined,
          active: body.active ?? undefined,
          sortOrder: body.sortOrder ?? undefined,
        },
      });
      emitPos("menu");
      return jsonOk({ category });
    }

    if (body.type === "item") {
      const item = await prisma.menuItem.update({
        where: { id: body.id },
        data: {
          name: body.name ?? undefined,
          description: body.description ?? undefined,
          priceCents: body.priceCents ?? undefined,
          active: body.active ?? undefined,
          categoryId: body.categoryId ?? undefined,
          sortOrder: body.sortOrder ?? undefined,
        },
      });
      emitPos("menu");
      return jsonOk({ item });
    }

    return jsonOk({ error: "无效请求" }, { status: 400 });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "menuAdmin");
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    if (!id) return jsonOk({ error: "缺少 id" }, { status: 400 });

    if (type === "category") {
      await prisma.category.delete({ where: { id } });
    } else if (type === "item") {
      await prisma.menuItem.delete({ where: { id } });
    } else {
      return jsonOk({ error: "无效类型" }, { status: 400 });
    }
    emitPos("menu");
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
