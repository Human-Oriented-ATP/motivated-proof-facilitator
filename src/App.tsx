import React, { useReducer, JSX } from "react"
import { ProofDiscoveryEnvironment } from "./components/ProofDiscoveryEnvironment"
import { ProofStateSelectionContext, proofStateSelectionReducer } from "./core/ProofStateSelectionContext"
import TypstContextProvider from "./components/TypstContext"
import { sampleProofDiscoveryState } from "../tests/samples/ProofDiscoveryState"

export default function App(): JSX.Element {
  const [selections, selectionsDispatch] = useReducer(proofStateSelectionReducer, [])

  return (
    <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
      <TypstContextProvider>
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <div style={styles.appHeader}>
            <h1 style={styles.appTitle}>Motivated Proof Facilitator</h1>
            <div style={styles.statementDisplay}>
              <span style={styles.statementLabel}>Statement</span>
              <span style={styles.statementText}>{sampleProofDiscoveryState.statement}</span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ProofDiscoveryEnvironment initialProofDiscoveryState={sampleProofDiscoveryState} />
          </div>
        </div>
      </TypstContextProvider>
    </ProofStateSelectionContext.Provider>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  appHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    borderBottom: "2px solid #e2e8f0",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  appTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1a74d2",
    margin: 0,
    whiteSpace: "nowrap",
  },
  statementDisplay: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    overflow: "hidden",
  },
  statementLabel: {
    flexShrink: 0,
    fontSize: "0.7rem",
    fontWeight: "700",
    color: "#ffffff",
    background: "#1a74d2",
    padding: "0.2rem 0.55rem",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  statementText: {
    fontSize: "0.95rem",
    color: "#374151",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontStyle: "italic",
  },
}
