import React, { JSX, useContext } from "react"
import { ProofStateContext as ProofStateContextType, ProofState as ProofStateType, ContextVariable, ProofStateContext } from "../core/ProofStateZod"
import { MathStatement } from "./MathStatement"
import { AtomicStatement } from "./AtomicStatement"
import { ProofStateLocationContext } from "../core/ProofStateSelectionContext"
import { ProofStateIdContext } from "../core/ProofDiscoveryStateContext"

/**
 * Render a single proof state context with its variables, hypotheses, and goals.
 * 
 * @param proofContext - `ProofStateContext`
 * @returns A JSX element containing the rendered proof context
 */
export function ProofStateContext(proofContext : ProofStateContextType): JSX.Element {
    /** Render a context variable with its kind indicator */
    const renderVariable = (variable: ContextVariable, idx: number): JSX.Element => {
        let kindIndicator = ""
        let kindColor = "#b91c1c"
        
        if (variable.kind === "meta") {
            kindIndicator = "?"
            kindColor = "#9333ea"
        } else if (variable.kind === "let") {
            kindIndicator = "≔"
            kindColor = "#0891b2"
        }

        return (
            <ProofStateLocationContext.Provider value={{ kind: "variable", label: variable.name }} key={idx}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {kindIndicator && (
                        <span style={{ 
                            color: kindColor, 
                            fontWeight: 'bold',
                            fontSize: '14px',
                            minWidth: '16px'
                        }}>
                            {kindIndicator}
                        </span>
                    )}
                    <span style={{
                        minWidth: 'fit-content',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <AtomicStatement address={[]} input={variable.name} />
                        <span>:</span>
                    </span>
                    <div style={{ display: 'inline-block' }}>
                        <ProofStateLocationContext.Provider value={{ kind: "variable_body", label: variable.name }}>
                            <AtomicStatement address={[]} input={variable.description} />
                        </ProofStateLocationContext.Provider>
                    </div>
                    {variable.kind === "let" && (
                        <>
                            <span style={{ margin: '0 4px' }}>≔</span>
                            <AtomicStatement address={[]} input={variable.value} />
                        </>
                    )}
                </div>
            </ProofStateLocationContext.Provider>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Variables - Reddish */}
            {proofContext.variables.length > 0 && (
                <div style={{
                    backgroundColor: '#fef2f2',
                    border: '2px solid #fecaca',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '20px',
                        backgroundColor: '#fef2f2',
                        padding: '0 8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#b91c1c',
                        letterSpacing: '0.1em'
                    }}>
                        VARIABLES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {proofContext.variables.map((variable, varIdx) => renderVariable(variable, varIdx))}
                    </div>
                </div>
            )}

            {/* Hypotheses - Orangeish */}
            {proofContext.hypotheses.length > 0 && (
                <div style={{
                    backgroundColor: '#fff7ed',
                    border: '2px solid #fed7aa',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '20px',
                        backgroundColor: '#fff7ed',
                        padding: '0 8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#c2410c',
                        letterSpacing: '0.1em'
                    }}>
                        HYPOTHESES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {proofContext.hypotheses.map((hypothesis, hypIdx) => (
                            <ProofStateLocationContext.Provider value={{ kind: "hypothesis", label: hypothesis.label }} key={hypIdx}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span 
                                        style={{ 
                                            color: '#c2410c', 
                                            fontSize: '16px', 
                                            fontWeight: 'bold',
                                            flexShrink: 0,
                                            userSelect: 'none'
                                        }}
                                    >
                                        •
                                    </span>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                        <div style={{ flex: '1' }}>
                                            <MathStatement address={[]} statement={hypothesis.statement} />
                                        </div>
                                        <span 
                                            style={{
                                                backgroundColor: '#fff7ed',
                                                border: '1px solid #fb923c',
                                                color: '#ea580c',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                whiteSpace: 'nowrap',
                                                userSelect: 'none'
                                            }}
                                        >
                                            {hypothesis.label}
                                        </span>
                                    </div>
                                </div>
                            </ProofStateLocationContext.Provider>
                        ))}
                    </div>
                </div>
            )}

            {/* Goals - Blueish */}
            {proofContext.goals.length > 0 && (
                <div style={{
                    backgroundColor: '#eff6ff',
                    border: '2px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '20px',
                        backgroundColor: '#eff6ff',
                        padding: '0 8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1d4ed8',
                        letterSpacing: '0.1em'
                    }}>
                        GOALS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {proofContext.goals.map((goal, goalIdx) => (
                            <ProofStateLocationContext.Provider value={{ kind: "goal", label: goal.label }} key={goalIdx}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span 
                                        style={{ 
                                            color: '#1d4ed8', 
                                            fontSize: '16px', 
                                            fontWeight: 'bold',
                                            flexShrink: 0,
                                            userSelect: 'none'
                                        }}
                                    >
                                        ⊢
                                    </span>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                        <div style={{ flex: '1' }}>
                                            <MathStatement address={[]} statement={goal.statement} />
                                        </div>
                                        <span 
                                            style={{
                                                backgroundColor: '#eff6ff',
                                                border: '1px solid #60a5fa',
                                                color: '#2563eb',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                whiteSpace: 'nowrap',
                                                userSelect: 'none'
                                            }}
                                        >
                                            {goal.label}
                                        </span>
                                    </div>
                                </div>
                            </ProofStateLocationContext.Provider>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}


/**
 * Render a complete proof state with all its contexts.
 * 
 * Each context is rendered separately with appropriate context providers
 * for proof state ID and location tracking.
 * 
 * @param proofState - `ProofState`
 * @returns A JSX element containing the rendered proof state
 */
export function ProofState(proofState : ProofStateType): JSX.Element {
    const { proofNodeId } = useContext(ProofStateIdContext)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {proofState.map((proofContext, idx) => (
                <ProofStateIdContext.Provider value={{ proofNodeId, proofContextId: idx }} key={idx}>
                    <div style={{ position: 'relative' }}>
                        <ProofStateContext {...proofContext} />
                    </div>
                </ProofStateIdContext.Provider>
            ))}
        </div>
    )
}