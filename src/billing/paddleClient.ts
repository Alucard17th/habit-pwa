// src/billing/paddleClient.ts
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

export function getPaddle(): Promise<Paddle | undefined> {
  if (!paddlePromise) {
    const token = process.env.REACT_APP_PADDLE_CLIENT_TOKEN;
    const environment =
      process.env.REACT_APP_PADDLE_SANDBOX === "true" ? "sandbox" : "production";

    if (!token) {
      console.error("[Paddle] Missing REACT_APP_PADDLE_CLIENT_TOKEN");
      paddlePromise = Promise.resolve(undefined);
    } else {
      console.log("[Paddle] Initializing…", { environment }); // 👈 add this
      paddlePromise = initializePaddle({ environment, token })
        .then((p) => {
          console.log("[Paddle] Initialized OK"); // 👈 add this
          return p;
        })
        .catch((e) => {
          console.error("[Paddle] initialize failed:", e);
          return undefined;
        });
    }
  }
  return paddlePromise;
}
