import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { emitPos } from "@/lib/events";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    const store = await prisma.store.findUnique({ where: { id: session.storeId } });
    return jsonOk({ store });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "settings");
    const body = z
      .object({
        name: z.string().optional(),
        displayName: z.string().optional(),
        primaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        address: z.string().optional().nullable(),
      })
      .parse(await req.json());

    const store = await prisma.store.update({
      where: { id: session.storeId },
      data: body,
    });
    emitPos("store");
    return jsonOk({ store });
  } catch (e) {
    return jsonError(e);
  }
}
