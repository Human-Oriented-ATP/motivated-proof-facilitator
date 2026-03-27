import React, { JSX } from "react"
import { ProofStateLocationContext, ProofStateSelectionContext, proofStateSelectionReducer } from "../src/core/ProofStateSelectionContext"
import { ProofStateIdContext } from "../src/core/ProofDiscoveryStateContext"

export default function ProofStateContextProvider({children}: {children: React.ReactNode}): JSX.Element {
    const [selections, selectionsDispatch] = React.useReducer(proofStateSelectionReducer, [])

    return (
        <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
            {children}
        </ProofStateSelectionContext.Provider>
    )
}