import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && "status" in error) {
    const status = Number((error as Error & { status: number }).status) || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  console.error(error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "服务器错误" },
    { status: 500 },
  );
}
