import React, { useState, useReducer, JSX } from "react"
import { ProofDiscoveryState } from "./core/ProofDiscoveryState"
import { ProofDiscoveryEnvironment } from "./components/ProofDiscoveryEnvironment"
import { ProofStateGenerator } from "./components/ProofStateGenerator"
import { ProofStateSelectionContext, proofStateSelectionReducer } from "./core/ProofStateSelectionContext"
import TypstContextProvider from "./components/TypstContext"
import { Box, Button, Chip, Tooltip, Typography } from "@mui/material"
import { sampleProofDiscoveryState } from "../tests/samples/ProofDiscoveryState"

/** Load the sample proof state when the URL contains ?demo */
const isDemoMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo")

export default function App(): JSX.Element {
  const [initialState, setInitialState] = useState<ProofDiscoveryState | null>(
    isDemoMode ? sampleProofDiscoveryState : null
  )
  const [selections, selectionsDispatch] = useReducer(proofStateSelectionReducer, [])

  const handleNewStatement = () => {
    setInitialState(null)
    selectionsDispatch({ type: "CLEAR_ALL_SELECTIONS" })
    // Remove ?demo from URL if present
    if (isDemoMode) {
      const url = new URL(window.location.href)
      url.searchParams.delete("demo")
      window.history.replaceState({}, "", url.toString())
    }
  }

  if (initialState) {
    return (
      <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
        <TypstContextProvider>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

            {/* ── App Header ── */}
            <Box sx={{
              display: "flex", alignItems: "center", gap: 2,
              px: 2.5, height: 52, flexShrink: 0,
              background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              borderBottom: "1px solid #1e3a5f",
              boxShadow: "0 2px 16px rgba(0,0,0,0.28)",
            }}>

              {/* Logo + title */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
                <Box sx={{
                  width: 30, height: 30, borderRadius: "8px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 10px rgba(59,130,246,0.45)",
                  fontSize: "16px", color: "white", fontStyle: "italic", fontWeight: 900,
                  lineHeight: 1, userSelect: "none",
                }}>
                  π
                </Box>
                <Typography sx={{
                  fontSize: "0.95rem", fontWeight: 800, color: "white",
                  letterSpacing: "-0.02em", whiteSpace: "nowrap",
                }}>
                  Motivated Proof Facilitator
                </Typography>
              </Box>

              {/* Divider */}
              <Box sx={{ width: "1px", height: 20, background: "#334155", flexShrink: 0 }} />

              {/* Statement */}
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1, overflow: "hidden", minWidth: 0 }}>
                <Chip label="STATEMENT" size="small" sx={{
                  flexShrink: 0, height: 20, borderRadius: "5px",
                  background: "rgba(59,130,246,0.18)", color: "#93c5fd",
                  border: "1px solid rgba(59,130,246,0.35)",
                  fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.08em",
                  "& .MuiChip-label": { px: "7px" },
                }} />
                <Tooltip title={initialState.statement} placement="bottom-start" arrow>
                  <Typography sx={{
                    fontSize: "0.85rem", color: "#cbd5e1",
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", fontStyle: "italic", minWidth: 0,
                  }}>
                    {initialState.statement}
                  </Typography>
                </Tooltip>
              </Box>

              {/* New Statement */}
              <Button variant="outlined" size="small" onClick={handleNewStatement} sx={{
                flexShrink: 0, color: "#94a3b8", borderColor: "#334155",
                borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600,
                background: "rgba(255,255,255,0.05)", whiteSpace: "nowrap",
                "&:hover": { borderColor: "#64748b", background: "rgba(255,255,255,0.1)", color: "white" },
              }}>
                ← New Statement
              </Button>
            </Box>

            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <ProofDiscoveryEnvironment initialProofDiscoveryState={initialState} />
            </Box>
          </Box>
        </TypstContextProvider>
      </ProofStateSelectionContext.Provider>
    )
  }

  return (
    <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
      <TypstContextProvider>
        <ProofStateGenerator
          onGenerated={setInitialState}
          onLoadDemo={() => setInitialState(sampleProofDiscoveryState)}
        />
      </TypstContextProvider>
    </ProofStateSelectionContext.Provider>
  )
}
