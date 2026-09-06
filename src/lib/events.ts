import { EventEmitter } from "events";

type PosEvent = {
  type: "tables" | "orders" | "kds" | "menu" | "store";
  at: number;
};

const globalForEvents = globalThis as unknown as { posEvents?: EventEmitter };

export const posEvents =
  globalForEvents.posEvents ?? new EventEmitter();

posEvents.setMaxListeners(200);

if (!globalForEvents.posEvents) {
  globalForEvents.posEvents = posEvents;
}

export function emitPos(type: PosEvent["type"]) {
  const payload: PosEvent = { type, at: Date.now() };
  posEvents.emit("pos", payload);
}

export type { PosEvent };
