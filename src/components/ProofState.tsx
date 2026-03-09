import React, { JSX, useContext } from "react"
import { ProofStateContext as ProofStateContextType, ProofState as ProofStateType, ContextVariable, ProofStateContext, LabelledStatement, ProofStateWithLibraryResult } from "../core/ProofStateZod"
import { MathStatement } from "./MathStatement"
import { AtomicStatement } from "./AtomicStatement"
import { ProofStateLocationContext } from "../core/ProofStateSelectionContext"
import { ProofStateSelectionContext } from "../core/ProofStateSelectionContext"
import { ProofStateIdContext } from "../core/ProofDiscoveryStateContext"

// ---------------------------------------------------------------------------
// Shared style helpers
// ---------------------------------------------------------------------------

function sectionCard(gradient: string, border: string, shadowColor: string): React.CSSProperties {
    return {
        background: gradient,
        border: `1px solid ${border}`,
        borderRadius: '14px',
        padding: '22px 20px 20px',
        boxShadow: `0 4px 12px ${shadowColor}, 0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.75)`,
        position: 'relative',
    }
}

function floatingLabel(bgColor: string, color: string): React.CSSProperties {
    return {
        position: 'absolute',
        top: '-12px',
        left: '20px',
        backgroundColor: bgColor,
        padding: '0 8px',
        fontSize: '14px',
        fontWeight: '600',
        color,
        letterSpacing: '0.1em',
        userSelect: 'none' as const,
    }
}

function labelPill(bg: string, border: string, color: string): React.CSSProperties {
    return {
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontSize: '13px',
        fontWeight: '600',
        padding: '4px 11px',
        borderRadius: '8px',
        whiteSpace: 'nowrap' as const,
        userSelect: 'none' as const,
        cursor: 'pointer',
        boxShadow: `0 1px 3px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.6)`,
        letterSpacing: '0.01em',
        transition: 'background 0.15s',
    }
}

// ---------------------------------------------------------------------------
// Section-specific theme tokens
// ---------------------------------------------------------------------------

const THEME = {
    variables: {
        gradient: 'linear-gradient(160deg, #fff5f5 0%, #fef2f2 55%, #fee8e8 100%)',
        border: '#fca5a5',
        shadow: 'rgba(185,28,28,0.10)',
        labelBgColor: '#fef2f2',
        labelColor: '#b91c1c',
        textColor: '#b91c1c',
    },
    hypotheses: {
        gradient: 'linear-gradient(160deg, #fffbf6 0%, #fff7ed 55%, #feefd8 100%)',
        border: '#fdba74',
        shadow: 'rgba(194,65,12,0.10)',
        labelBgColor: '#fff7ed',
        labelColor: '#c2410c',
        bulletColor: '#c2410c',
        pillBg: 'linear-gradient(135deg, #fff7ed 0%, #fde8cc 100%)',
        pillBorder: '#fb923c',
        pillColor: '#ea580c',
        pillHoverBg: '#fed7aa',
    },
    goals: {
        gradient: 'linear-gradient(160deg, #f7faff 0%, #eff6ff 55%, #e5efff 100%)',
        border: '#93c5fd',
        shadow: 'rgba(29,78,216,0.10)',
        labelBgColor: '#eff6ff',
        labelColor: '#1d4ed8',
        bulletColor: '#1d4ed8',
        pillBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        pillBorder: '#60a5fa',
        pillColor: '#2563eb',
        pillHoverBg: '#bfdbfe',
    },
    library: {
        gradient: 'linear-gradient(160deg, #fffef5 0%, #fefce8 55%, #fef8c5 100%)',
        border: '#fde047',
        shadow: 'rgba(161,98,7,0.10)',
        labelBgColor: '#fefce8',
        labelColor: '#a16207',
        bulletColor: '#a16207',
        pillBg: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
        pillBorder: '#eab308',
        pillColor: '#a16207',
        pillHoverBg: '#fde047',
    },
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Props for rendering a single proof context. */
export type ProofStateContextProps = {
    /** The proof context to render */
    proofContext: ProofStateContextType
}

/**
 * Render a single proof state context with its variables, hypotheses, and goals.
 */
export function ProofStateContext({ proofContext }: ProofStateContextProps): JSX.Element {
    const { dispatch } = useContext(ProofStateSelectionContext)
    const proofStateId = useContext(ProofStateIdContext)

    /** Render a context variable with its kind indicator */
    const renderVariable = (variable: ContextVariable, idx: number): JSX.Element => {
        let kindIndicator: React.ReactNode = null

        if (variable.kind === "meta") {
            kindIndicator = (
                <span style={{
                    color: '#9333ea',
                    fontSize: '18px',
                    fontWeight: '700',
                    lineHeight: 1,
                    userSelect: 'none',
                    filter: 'drop-shadow(0 1px 1px rgba(147,51,234,0.30))',
                }}>?</span>
            )
        } else if (variable.kind === "let") {
            kindIndicator = (
                <span style={{
                    color: '#0891b2',
                    fontSize: '13px',
                    fontWeight: '700',

                    letterSpacing: '0.03em',
                    lineHeight: 1,
                    userSelect: 'none',
                }}>let</span>
            )
        }

        return (
            <ProofStateLocationContext.Provider value={{ kind: "variable", label: variable.name }} key={idx}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {kindIndicator}
                    <span style={{
                        minWidth: 'fit-content',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <AtomicStatement address={[]} input={variable.name} />
                        <span style={{ color: '#9ca3af' }}>:</span>
                    </span>
                    <div style={{ display: 'inline-block' }}>
                        <ProofStateLocationContext.Provider value={{ kind: "variable_body", label: variable.name }}>
                            <AtomicStatement address={[]} input={variable.description} />
                        </ProofStateLocationContext.Provider>
                    </div>
                    {variable.kind === "let" && (
                        <>
                            <span style={{ margin: '0 4px', color: '#0891b2', fontSize: '17px', fontWeight: '600' }}>≔</span>
                            <AtomicStatement address={[]} input={variable.value} />
                        </>
                    )}
                </div>
            </ProofStateLocationContext.Provider>
        )
    }

    /** Render a hypothesis with its label */
    const renderHypothesis = (hypothesis: LabelledStatement, idx: number): JSX.Element => {
        const t = THEME.hypotheses
        const location = { kind: "hypothesis" as const, label: hypothesis.label }
        const handleLabelClick = () => {
            dispatch({
                type: 'TOGGLE_SELECTION',
                selection: {
                    proofStateId,
                    location,
                    address: [],
                    selection: hypothesis.statement,
                }
            })
        }
        return (
            <ProofStateLocationContext.Provider value={location} key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                        color: t.bulletColor,
                        fontSize: '18px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        userSelect: 'none',
                        lineHeight: 1,
                        filter: 'drop-shadow(0 1px 1px rgba(194,65,12,0.20))',
                    }}>
                        •
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                        <div style={{ flex: '1' }}>
                            <MathStatement address={[]} statement={hypothesis.statement} polarity={true} />
                        </div>
                        <span
                            onClick={handleLabelClick}
                            style={labelPill(t.pillBg, t.pillBorder, t.pillColor)}
                            onMouseEnter={e => (e.currentTarget.style.background = t.pillHoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = t.pillBg)}
                        >
                            {hypothesis.label}
                        </span>
                    </div>
                </div>
            </ProofStateLocationContext.Provider>
        )
    }

    /** Render a goal with its label */
    const renderGoal = (goal: LabelledStatement, idx: number): JSX.Element => {
        const t = THEME.goals
        const location = { kind: "goal" as const, label: goal.label }
        const handleLabelClick = () => {
            dispatch({
                type: 'TOGGLE_SELECTION',
                selection: {
                    proofStateId,
                    location,
                    address: [],
                    selection: goal.statement,
                }
            })
        }
        return (
            <ProofStateLocationContext.Provider value={location} key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                        color: t.bulletColor,
                        fontSize: '16px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        userSelect: 'none',
                        lineHeight: 1,
                        filter: 'drop-shadow(0 1px 1px rgba(29,78,216,0.20))',
                    }}>
                        ⊢
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                        <div style={{ flex: '1' }}>
                            <MathStatement address={[]} statement={goal.statement} polarity={false} />
                        </div>
                        <span
                            onClick={handleLabelClick}
                            style={labelPill(t.pillBg, t.pillBorder, t.pillColor)}
                            onMouseEnter={e => (e.currentTarget.style.background = t.pillHoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = t.pillBg)}
                        >
                            {goal.label}
                        </span>
                    </div>
                </div>
            </ProofStateLocationContext.Provider>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Variables */}
            {proofContext.variables.length > 0 && (() => {
                const t = THEME.variables
                return (
                    <div style={sectionCard(t.gradient, t.border, t.shadow)}>
                        <div style={floatingLabel(t.labelBgColor, t.labelColor)}>
                            VARIABLES
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {proofContext.variables.map((variable, varIdx) => renderVariable(variable, varIdx))}
                        </div>
                    </div>
                )
            })()}

            {/* Hypotheses */}
            {proofContext.hypotheses.length > 0 && (() => {
                const t = THEME.hypotheses
                return (
                    <div style={sectionCard(t.gradient, t.border, t.shadow)}>
                        <div style={floatingLabel(t.labelBgColor, t.labelColor)}>
                            HYPOTHESES
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {proofContext.hypotheses.map((hypothesis, hypIdx) => renderHypothesis(hypothesis, hypIdx))}
                        </div>
                    </div>
                )
            })()}

            {/* Goals */}
            {proofContext.goals.length > 0 && (() => {
                const t = THEME.goals
                return (
                    <div style={sectionCard(t.gradient, t.border, t.shadow)}>
                        <div style={floatingLabel(t.labelBgColor, t.labelColor)}>
                            GOALS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {proofContext.goals.map((goal, goalIdx) => renderGoal(goal, goalIdx))}
                        </div>
                    </div>
                )
            })()}

        </div>
    )
}


/** Props for the ProofState component. */
export type ProofStateProps = {
    /** The complete proof state to render */
    proofState: ProofStateType
}

/**
 * Render a complete proof state with all its contexts.
 */
export function ProofState({ proofState }: ProofStateProps): JSX.Element {
    const { proofNodeId } = useContext(ProofStateIdContext)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {proofState.map((proofContext, idx) => (
                <React.Fragment key={idx}>
                    <ProofStateIdContext.Provider value={{ proofNodeId, proofContextId: idx }}>
                        <div style={{ position: 'relative' }}>
                            <ProofStateContext proofContext={proofContext} />
                        </div>
                    </ProofStateIdContext.Provider>
                    {idx < proofState.length - 1 && (
                        <div style={{
                            height: '1px',
                            margin: '0 16px',
                            background: 'linear-gradient(90deg, transparent 0%, #cbd5e1 20%, #94a3b8 50%, #cbd5e1 80%, transparent 100%)',
                        }} />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}

export function ProofStateWithLibraryResult({ proofState, libraryResult }: ProofStateWithLibraryResult): JSX.Element {
    const t = THEME.library
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {libraryResult && (
                <div style={sectionCard(t.gradient, t.border, t.shadow)}>
                    <div style={floatingLabel(t.labelBgColor, t.labelColor)}>
                        LIBRARY RESULT
                    </div>
                    <ProofStateLocationContext.Provider value={{ kind: "library_statement", label: libraryResult.label }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                                color: t.bulletColor,
                                fontSize: '16px',
                                fontWeight: 'bold',
                                flexShrink: 0,
                                userSelect: 'none',
                                lineHeight: 1,
                                filter: 'drop-shadow(0 1px 1px rgba(161,98,7,0.25))',
                            }}>
                                ★
                            </span>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                <div style={{ flex: '1' }}>
                                    <MathStatement address={[]} statement={libraryResult.statement} polarity={true} />
                                </div>
                                <span
                                    style={labelPill(t.pillBg, t.pillBorder, t.pillColor)}
                                    onMouseEnter={e => (e.currentTarget.style.background = t.pillHoverBg)}
                                    onMouseLeave={e => (e.currentTarget.style.background = t.pillBg)}
                                >
                                    {libraryResult.label}
                                </span>
                            </div>
                        </div>
                    </ProofStateLocationContext.Provider>
                </div>
            )}

            <ProofState proofState={proofState} />
        </div>
    )
}
