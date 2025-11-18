import React, { JSX, useEffect, useRef, useState } from "react"
import { SubExpression, SubExpressionCore } from "../core/SubExpression"
import { ProofStateSelectionContext, StatementAddress, ProofStateLocationContext, areStatementAddressesEqual } from "../core/ProofStateSelectionContext"
import { ProofStateIdContext } from "../core/ProofStateIdContext"

type MathCompilationResponse = 
  { svg: string, subexpressions: SubExpression[] } |
  { error: string }

export const WasmContext = 
    React.createContext<React.RefObject<{ compile: (input: string) => string} | null> | null>(null)

export async function loadWasm(wasm: React.RefObject<{ compile: (input: string) => string } | null>) {
    if (!wasm.current) {
        try {
            const mod = await import("../../pkg/typst_wasm.js")
            await mod.default()
            mod.init_panic_hook?.()
            wasm.current = { compile: mod.compile_math_with_subexpressions }
            console.log("WASM loaded successfully")
        } catch (e) {
            console.warn("Failed to load WASM: ", e)
        }
    }
}

/** Props for the `MathExpression` component. */
export type MathExpressionProps = {
    /** The location within the logical structure of a larger statement where this expression is situated. */
    address: StatementAddress,
    /** An atomic statement is structured as segments of text interspersed with mathematical formulas,
     * and the index points to which formula within the statement this sub-expression corresponds to. */ 
    index: number,
    /** The mathematical plaintext to render as an interactive expression. */
    input: string
}

/**
 * Render a string as a hoverable and clickable math expression.
 * 
 * This component compiles a math expression using WASM, renders it as SVG, and provides
 * interactive features for selecting and highlighting subexpressions. It supports:
 * - Hovering over subexpressions to highlight them
 * - Clicking to toggle selection of subexpressions
 * - Visual feedback for both hover and selections
 * 
 * @param props - `MathExpressionProps`
 * @param props.address - the location within the logical structure of a larger statement where this expression is situated
 * @param props.index - an atomic statement is structured as segments of text interspersed with mathematical formulas,
 * and the index points to which formula within the statement this sub-expression corresponds to.
 * @param props.input - The mathematical plaintext to render as an interactive expression
 * 
 * @returns A JSX element containing the rendered SVG math expression with an interactive overlay
 * 
 * @remarks
 * - Requires `WasmContext` to be provided for math compilation
 * - Requires `ProofStateSelectionContext` for managing selections
 * - Requires `ProofStateLocationContext` and `ProofStateIdContext` for identifying the current proof location
 * - Selection state is managed globally through the `ProofStateSelectionContext`
 * 
 */
export function MathExpression({ address, index, input }: MathExpressionProps): JSX.Element {
    const wasm = React.useContext(WasmContext)
    const { selections, dispatch } = React.useContext(ProofStateSelectionContext)
    const proofStateLocation = React.useContext(ProofStateLocationContext)
    const proofStateId = React.useContext(ProofStateIdContext)
    
    if (!wasm?.current) {
        console.warn("WASM not loaded yet")
        return <>Loading...</>
    }

    let data: MathCompilationResponse
    try {
        const result = wasm.current.compile(input)
        data = JSON.parse(result)
    } catch (e) {
        console.error("Failed to compile math expression:", e)
        data = { error: String(e) }
    }
    
    if ("error" in data) {
        console.warn("Math compilation error:", data.error)
        return <div style={{ color: 'red', fontWeight: 'bold', padding: '8px' }}>
            ERROR: {data.error}
        </div>
    }
    
    const subexprs = data.subexpressions
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)

    const overlayRef = useRef<SVGSVGElement | null>(null)

    // Ref callback to inject SVG and configure overlay when the container mounts
    const svgContainerRef = useRef<HTMLDivElement | null>(null)
    const setSvgContainerRef = (element: HTMLDivElement | null) => {
        svgContainerRef.current = element
        if (element) {
            // Safely parse SVG string and append to the container
            element.innerHTML = ""
            try {
                const parser = new DOMParser()
                const doc = parser.parseFromString(data.svg, "image/svg+xml")
                const svg = doc.querySelector("svg")
                if (svg) {
                    // Change white fill to black for visibility
                    svg.querySelectorAll('[fill="#ffffff"]').forEach(el => {
                        el.setAttribute('fill', '#000000')
                    })
                    
                    element.appendChild(svg)
                    // configure overlay viewBox/size to match rendered svg
                    const overlay = overlayRef.current
                    if (overlay) {
                        for (const attr of ["viewBox", "width", "height"]) {
                            const value = svg.getAttribute(attr)
                            if (value) overlay.setAttribute(attr, value)
                        }
                    }
                }
            } catch (e) {
                console.warn("Failed to parse SVG:", e)
            }
        }
    }

    // Update overlay whenever hover or selections change
    useEffect(() => {
        const overlay = overlayRef.current
        if (!overlay) return

        overlay.innerHTML = ""

        // Helper to create an SVG rect
        const createRect = (sub: SubExpression, fill: string, stroke?: string, strokeWidth?: number) => {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
            const padding = 1
            
            rect.setAttribute("x", String(sub.x - padding))
            rect.setAttribute("y", String(sub.y - padding))
            rect.setAttribute("width", String(sub.width + 2 * padding))
            rect.setAttribute("height", String(sub.height + 2 * padding))
            rect.setAttribute("rx", "2")
            rect.setAttribute("ry", "2")
            rect.setAttribute("fill", fill)
            if (stroke) {
                rect.setAttribute("stroke", stroke)
                rect.setAttribute("stroke-width", String(strokeWidth || 1.25))
            }
            rect.setAttribute("pointer-events", "none")
            
            return rect
        }

        // Draw blue highlights for selected expressions
        if (proofStateId && proofStateLocation) {
            selections.forEach(selection => {
                // Check if this selection matches the current context
                if (selection.proofStateId === proofStateId &&
                    selection.location.kind === proofStateLocation.kind &&
                    selection.location.label === proofStateLocation.label &&
                    areStatementAddressesEqual(selection.address, address)) {
                    
                    // Find the matching subexpression
                    const matchingSubexpr = subexprs.find(s => 
                        s.text === (selection.selection as SubExpressionCore).text &&
                        s.source_start === (selection.selection as SubExpressionCore).source_start &&
                        s.source_end === (selection.selection as SubExpressionCore).source_end
                    )
                    
                    if (matchingSubexpr) {
                        overlay.appendChild(createRect(
                            matchingSubexpr, 
                            "rgba(59, 130, 246, 0.25)",
                            "rgba(59, 130, 246, 0.4)",
                            1.5
                        ))
                    }
                }
            })
        }

        // Draw yellow highlight for hover (on top of selection highlights)
        if (hoverIndex !== null && subexprs[hoverIndex]) {
            overlay.appendChild(createRect(
                subexprs[hoverIndex], 
                "rgba(250, 204, 21, 0.2)",
                "rgba(250, 204, 21, 0.3)",
                1.25
            ))
        }
    }, [hoverIndex, selections, proofStateId, proofStateLocation])

    // Find smallest subexpression at a point
    function findSmallestAtPoint(x: number, y: number): number {
        let idx = -1
        let bestArea = Infinity
        subexprs.forEach((s, i) => {
            if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
                const area = s.width * s.height
                if (area < bestArea) {
                    bestArea = area
                    idx = i
                }
            }
        })
        return idx
    }

    // Handle mouse movement for hover
    function handleMouseMove(e: React.MouseEvent) {
        const svgEl = svgContainerRef.current?.querySelector("svg")
        if (!svgEl) return

        const rect = svgEl.getBoundingClientRect()
        const vb = svgEl.viewBox?.baseVal
        if (!vb) return

        const scaleX = vb.width / rect.width
        const scaleY = vb.height / rect.height
        const mouseX = (e.clientX - rect.left) * scaleX + vb.x
        const mouseY = (e.clientY - rect.top) * scaleY + vb.y

        const idx = findSmallestAtPoint(mouseX, mouseY)
        setHoverIndex(idx >= 0 ? idx : null)
    }

    // Handle click to toggle selection
    function handleClick(e: React.MouseEvent) {
        if (!proofStateLocation) {
            console.warn("Cannot select: missing proofStateLocation context")
            return
        }
        
        const svgEl = svgContainerRef.current?.querySelector("svg")
        if (!svgEl) return
        
        const rect = svgEl.getBoundingClientRect()
        const vb = svgEl.viewBox?.baseVal
        if (!vb) return
        
        const scaleX = vb.width / rect.width
        const scaleY = vb.height / rect.height
        const mouseX = (e.clientX - rect.left) * scaleX + vb.x
        const mouseY = (e.clientY - rect.top) * scaleY + vb.y

        const idx = findSmallestAtPoint(mouseX, mouseY)
        if (idx >= 0 && subexprs[idx]) {
            const sub = subexprs[idx]
            dispatch({
                type: 'TOGGLE_SELECTION',
                selection: {
                    proofStateId,
                    location: proofStateLocation,
                    address,
                    selection: {
                        text: sub.text,
                        source_start: sub.source_start,
                        source_end: sub.source_end,
                        index
                    }
                }
            })
        }
    }

    return (
        <div style={{ position: "relative", display: "inline-block", padding: "4px" }}>
            <div
                ref={setSvgContainerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={handleClick}
                style={{ display: "inline-block", position: "relative", cursor: "pointer" }}
            ></div>
            <svg
                ref={overlayRef}
                style={{ position: "absolute", top: "4px", left: "4px", pointerEvents: "none" }}
            />
        </div>
    )
}