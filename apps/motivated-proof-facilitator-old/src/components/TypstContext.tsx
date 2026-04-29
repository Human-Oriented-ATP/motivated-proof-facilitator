import React, { JSX } from "react"
import { loadWasm, WasmContext } from "./MathExpression"

export default function TypstContextProvider({children}: {children: React.ReactNode}): JSX.Element {
    const wasmRef = React.useRef<{ compile: (input: string) => string } | null>(null)
    const [wasmLoaded, setWasmLoaded] = React.useState(false)

    React.useEffect(() => {
        loadWasm(wasmRef).then(() => {
            setWasmLoaded(true)
        })
    }, [])
    
    if (!wasmLoaded) {
        return <div>Loading...</div>
    } else {
    return (
        <WasmContext.Provider value={wasmRef}>
            {children}
        </WasmContext.Provider>
        )
    }
}