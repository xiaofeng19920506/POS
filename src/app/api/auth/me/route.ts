import { jsonError, jsonOk } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonOk({ user: null }, { status: 401 });
    const store = await prisma.store.findUnique({ where: { id: session.storeId } });
    return jsonOk({ user: session, store });
  } catch (e) {
    return jsonError(e);
  }
}
