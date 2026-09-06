"use client";

import { useEffect, useRef } from "react";

export function usePosEvents(onEvent: (type: string) => void) {
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as { type: string };
        if (data.type && data.type !== "ping") {
          cb.current(data.type);
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, []);
}
