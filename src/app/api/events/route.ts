import { posEvents, type PosEvent } from "@/lib/events";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let cleanup: (() => void) | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: PosEvent | { type: "ping"; at: number }) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          cleanup?.();
        }
      };
      send({ type: "ping", at: Date.now() });
      const onPos = (event: PosEvent) => send(event);
      posEvents.on("pos", onPos);
      const ping = setInterval(() => send({ type: "ping", at: Date.now() }), 25000);
      cleanup = () => {
        clearInterval(ping);
        posEvents.off("pos", onPos);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
