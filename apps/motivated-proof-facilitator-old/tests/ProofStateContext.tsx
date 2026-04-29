import React, { JSX } from "react"
import { ProofStateLocationContext, ProofStateSelectionContext, proofStateSelectionReducer } from "../src/core/ProofStateSelectionContext"
import { ProofStateIdContext } from "../src/core/ProofDiscoveryStateContext"
import TypstContextProvider from "../src/components/TypstContext"

export default function ProofStateContextProvider({children}: {children: React.ReactNode}): JSX.Element {
    const [selections, selectionsDispatch] = React.useReducer(proofStateSelectionReducer, [])

    return (
        <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
        <TypstContextProvider>
            {children}
        </TypstContextProvider>
        </ProofStateSelectionContext.Provider>
    )
}