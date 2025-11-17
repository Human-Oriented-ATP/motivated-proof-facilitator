import React, { JSX } from "react";
import { loadWasm, WasmContext } from "../src/components/MathExpression";
import { ProofStateLocationContext, ProofStateSelectionContext, proofStateSelectionReducer } from "../src/core/ProofStateSelectionContext";
import { ProofStateIdContext } from "../src/core/ProofStateIdContext";

export default function ProofStateContextProvider({children}: {children: React.ReactNode}): JSX.Element {
    const wasmRef = React.useRef<{ compile: (input: string) => string } | null>(null)
    const [wasmLoaded, setWasmLoaded] = React.useState(false)

    React.useEffect(() => {
        loadWasm(wasmRef).then(() => {
            setWasmLoaded(true)
        })
    }, [])
    
    const [selections, selectionsDispatch] = React.useReducer(proofStateSelectionReducer, [])

    if (!wasmLoaded) {
        return <div>Loading...</div>
    } else {
    return (
        <WasmContext.Provider value={wasmRef}>
        <ProofStateSelectionContext.Provider value={{ selections, dispatch: selectionsDispatch }}>
        <ProofStateLocationContext.Provider value={{kind: "goal", label: ""}}>
        <ProofStateIdContext.Provider value={-1}>
            {children}
        </ProofStateIdContext.Provider>
        </ProofStateLocationContext.Provider>
        </ProofStateSelectionContext.Provider>
        </WasmContext.Provider>
        )
    }
}