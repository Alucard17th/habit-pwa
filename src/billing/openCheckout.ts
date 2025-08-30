// src/billing/openCheckout.ts
import { getPaddle } from "./paddleClient";

export async function openCheckout(options: any) {
  if (!options || typeof options !== "object") {
    console.error("[Paddle] openCheckout: invalid options", options);
    return;
  }
  if (!options.items?.length || !options.items[0]?.priceId) {
    console.error("[Paddle] Missing items[0].priceId in options:", options);
    return;
  }

  const paddle = await getPaddle();
  if (!paddle) {
    console.error("[Paddle] Not initialized (no paddle instance).");
    return;
  }

  // Prefer overlay for SPA (server sent inline). You can keep inline if you have a container.
  options.settings = { displayMode: "overlay", ...(options.settings || {}) };
  console.log("[Paddle] Opening checkout with:", options); // 👈 add this

  try {
    // NOTE: Paddle.Checkout.open does not return a Promise. Use callbacks (below) if needed.
    paddle.Checkout.open({
      ...options,
      onLoaded: () => console.log("[Paddle] Checkout loaded"),
      onPaymentComplete: (data: any) => console.log("[Paddle] Payment complete", data),
      onClose: () => console.log("[Paddle] Checkout closed"),
      onError: (err: any) => console.error("[Paddle] Checkout error", err),
    });
  } catch (err) {
    console.error("[Paddle] Checkout.open threw:", err);
  }
}
