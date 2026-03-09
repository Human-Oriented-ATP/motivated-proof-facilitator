import React, { useState, useReducer, JSX } from "react"
import { ProofDiscoveryState } from "./core/ProofDiscoveryState"
import { ProofDiscoveryEnvironment } from "./components/ProofDiscoveryEnvironment"
import { ProofStateGenerator } from "./components/ProofStateGenerator"
import { ProofStateSelectionContext, proofStateSelectionReducer } from "./core/ProofStateSelectionContext"
import TypstContextProvider from "./components/TypstContext"
import { Box, Button, Chip, Typography } from "@mui/material"
import { sampleProofDiscoveryState } from "../tests/samples/ProofDiscoveryState"

export default function App(): JSX.Element {
  const [initialState, setInitialState] = useState<ProofDiscoveryState | null>(sampleProofDiscoveryState)
  const [selections, selectionsDispatch] = useReducer(proofStateSelectionReducer, [])

  if (initialState) {
    return (
      <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
        <TypstContextProvider>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            {/* ── App Header ── */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2.5,
              py: 0.875,
              background: "linear-gradient(180deg, #ffffff 0%, #f3f7fc 100%)",
              borderBottom: "1px solid #b8ccda",
              boxShadow: "0 2px 8px rgba(30,60,100,0.08)",
              flexShrink: 0,
            }}>
              <Typography sx={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "#1d4ed8",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
                cursor: "default",
              }}>
                Motivated Proof Facilitator
              </Typography>

              <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1, overflow: "hidden", minWidth: 0 }}>
                <Chip
                  label="STATEMENT"
                  size="small"
                  sx={{
                    flexShrink: 0,
                    height: 20,
                    borderRadius: "4px",
                    background: "#1d4ed8",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    letterSpacing: "0.07em",
                    "& .MuiChip-label": { px: "7px" },
                  }}
                />
                <Typography sx={{
                  fontSize: "0.875rem",
                  color: "#374151",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontStyle: "italic",
                  minWidth: 0,
                }}>
                  {initialState.statement}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setInitialState(null)
                  selectionsDispatch({ type: "CLEAR_ALL_SELECTIONS" })
                }}
                sx={{
                  flexShrink: 0,
                  color: "#1d4ed8",
                  borderColor: "#93aeed",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "none",
                  background: "linear-gradient(180deg,#ffffff,#eff4ff)",
                  boxShadow: "0 1px 2px rgba(30,70,200,0.08)",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: "#1d4ed8",
                    background: "linear-gradient(180deg,#eff4ff,#dbeafe)",
                  },
                }}
              >
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
        <ProofStateGenerator onGenerated={setInitialState} />
      </TypstContextProvider>
    </ProofStateSelectionContext.Provider>
  )
}
