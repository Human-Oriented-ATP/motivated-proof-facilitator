import React from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider, CssBaseline } from "@mui/material"
import { theme } from "./theme"
import App from "./App"

const root = document.getElementById("root")
if (!root) throw new Error("No element with id 'root' found.")

createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
