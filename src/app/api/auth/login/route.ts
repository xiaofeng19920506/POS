import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  employeeId: z.string().min(1),
  pin: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const staff = await prisma.staff.findFirst({
      where: { employeeId: body.employeeId, active: true },
    });
    if (!staff) {
      return jsonOk({ error: "工号或密码错误" }, { status: 401 });
    }
    const ok = await bcrypt.compare(body.pin, staff.pinHash);
    if (!ok) {
      return jsonOk({ error: "工号或密码错误" }, { status: 401 });
    }

    const token = await createSessionToken({
      id: staff.id,
      storeId: staff.storeId,
      employeeId: staff.employeeId,
      name: staff.name,
      role: staff.role,
    });

    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
    });

    return jsonOk({
      user: {
        id: staff.id,
        storeId: staff.storeId,
        employeeId: staff.employeeId,
        name: staff.name,
        role: staff.role,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
