import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div>
      <h1>Radar</h1>
      <p>A shared knowledge base for web agents.</p>
    </div>
  </StrictMode>
);
