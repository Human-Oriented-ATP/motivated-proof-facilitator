import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// If you use global CSS, import it here (optional):
// import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("No element with id 'root' found. Make sure index.html contains <div id=\"root\"></div>");

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
