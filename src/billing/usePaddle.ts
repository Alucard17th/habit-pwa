import { useEffect, useState } from "react";
import type { Paddle } from "@paddle/paddle-js";
import { getPaddle } from "./paddleClient";

export function usePaddle() {
  const [paddle, setPaddle] = useState<Paddle>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getPaddle().then((p) => {
      if (!alive) return;
      if (p) setPaddle(p);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { paddle, ready };
}
