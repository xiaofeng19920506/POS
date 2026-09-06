import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    assertCan(session, "staffAdmin");
    const staff = await prisma.staff.findMany({
      where: { storeId: session.storeId },
      orderBy: { employeeId: "asc" },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    return jsonOk({ staff });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "staffAdmin");
    const body = z
      .object({
        employeeId: z.string().min(1),
        name: z.string().min(1),
        pin: z.string().min(4).max(8),
        role: z.nativeEnum(Role),
      })
      .parse(await req.json());

    const pinHash = await bcrypt.hash(body.pin, 10);
    const staff = await prisma.staff.create({
      data: {
        storeId: session.storeId,
        employeeId: body.employeeId,
        name: body.name,
        pinHash,
        role: body.role,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        active: true,
      },
    });
    return jsonOk({ staff });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session, "staffAdmin");
    const body = await req.json();
    const data: Record<string, unknown> = {
      name: body.name ?? undefined,
      role: body.role ?? undefined,
      active: body.active ?? undefined,
      employeeId: body.employeeId ?? undefined,
    };
    if (body.pin) {
      data.pinHash = await bcrypt.hash(String(body.pin), 10);
    }
    const staff = await prisma.staff.update({
      where: { id: body.id },
      data,
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        active: true,
      },
    });
    return jsonOk({ staff });
  } catch (e) {
    return jsonError(e);
  }
}
