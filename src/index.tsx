import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
// @ts-ignore
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
// @ts-ignore
import reportWebVitals from "./reportWebVitals";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA behavior: change to register() if you want offline by default
serviceWorkerRegistration.register();
// serviceWorkerRegistration.unregister();

// Perf metrics (optional)
reportWebVitals();
