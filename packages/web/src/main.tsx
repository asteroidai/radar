import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <div>
        <h1>Radar</h1>
        <p>A shared knowledge base for web agents.</p>
      </div>
    </ConvexProvider>
  </StrictMode>,
);
