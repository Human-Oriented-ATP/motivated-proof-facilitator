import React, { JSX, useContext, useState } from "react"
import { Statement } from "../core/ProofState"
import { AtomicStatement } from "./AtomicStatement"
import { StatementAddress, ProofStateSelectionContext, ProofStateLocationContext, StatementCoordinate,
        areStatementAddressesEqual, coordinatePolarity } from "../core/ProofStateSelectionContext"
import { areProofStateIdsEqual, ProofStateIdContext } from "../core/ProofDiscoveryStateContext"
import Tooltip from "@mui/material/Tooltip"

// Import generated logical symbol SVGs
import conjunctionSvg from "../assets/logical-symbols/conjunction.svg"
import disjunctionSvg from "../assets/logical-symbols/disjunction.svg"
import negationSvg from "../assets/logical-symbols/negation.svg"
import implicationSvg from "../assets/logical-symbols/implication.svg"
import equivalenceSvg from "../assets/logical-symbols/equivalence.svg"
import universalSvg from "../assets/logical-symbols/universal.svg"
import existentialSvg from "../assets/logical-symbols/existential.svg"

const TOOLTIP_SLOT = { tooltip: { sx: { fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em' } } } as const

// Per-section theme RGB values, matching ProofState.tsx THEME
type RGB = [number, number, number]

function getLocationRgb(kind: string): RGB {
    switch (kind) {
        case 'hypothesis':        return [194, 65,  12 ]
        case 'goal':              return [29,  78,  216]
        case 'library_statement': return [161, 98,  7  ]
        case 'variable':
        case 'variable_body':     return [185, 28,  28 ]
        default:                  return [100, 116, 139]
    }
}

function toRgba([r, g, b]: RGB, alpha: number): string {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Connective symbol wrapped in a soft colored glow matching the section theme
function Connective({ src, alt, label, height = '1.1em', margin = '0 6px', padding = '2px 5px' }: {
    src: string; alt: string; label: string
    height?: string; margin?: string; padding?: string
}) {
    const [hovered, setHovered] = useState(false)
    return (
        <Tooltip title={label} placement="top" arrow disableInteractive enterDelay={350} slotProps={TOOLTIP_SLOT}>
            <span
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle',
                    borderRadius: '3px',
                    background: hovered ? 'rgba(0,0,0,0.06)' : 'transparent',
                    padding, margin,
                    cursor: 'help', userSelect: 'none' as const, lineHeight: 0,
                    transition: 'background 0.15s ease',
                }}
            >
                <img src={src} alt={alt} style={{ display: 'block', height, width: 'auto' }} />
            </span>
        </Tooltip>
    )
}

const ConjunctionSymbol = () => <Connective src={conjunctionSvg}  alt="∧" label="And"            />
const DisjunctionSymbol = () => <Connective src={disjunctionSvg}  alt="∨" label="Or"             />
const ImplicationSymbol = () => <Connective src={implicationSvg}  alt="⇒" label="Implies"        />
const EquivalenceSymbol = () => <Connective src={equivalenceSvg}  alt="⇔" label="If and only if" />
const NegationSymbol    = () => <Connective src={negationSvg}     alt="¬" label="Not"             height="0.55em" margin="0 4px 0 0" padding="4px 5px" />

// Quantifier symbol: plain inline image with tooltip (glow comes from QuantifierGroup)
function QuantifierSymbol({ src, alt, label }: { src: string; alt: string; label: string }) {
    return (
        <Tooltip title={label} placement="top" arrow disableInteractive enterDelay={350} slotProps={TOOLTIP_SLOT}>
            <span style={{ display: 'inline', cursor: 'help', userSelect: 'none' }}>
                <img src={src} alt={alt} style={{ display: 'inline-block', height: '1.1em', width: 'auto', verticalAlign: '-0.18em' }} />
            </span>
        </Tooltip>
    )
}

// Soft glow wrapper that envelops the quantifier symbol + its binding together
function QuantifierGroup({ rgb, children }: { rgb: RGB; children: React.ReactNode }) {
    return (
        <span style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            borderRadius: '5px',
            background: toRgba(rgb, 0.04),
            boxShadow: `0 0 10px 1px ${toRgba(rgb, 0.15)}, 0 0 28px 6px ${toRgba(rgb, 0.06)}`,
            padding: '1px 6px 1px 4px',
            marginRight: '4px',
        }}>
            {children}
        </span>
    )
}

const QColon = () => (
    <span style={{ color: '#334155', fontSize: '1.0em', fontWeight: '600', margin: '0 3px', userSelect: 'none', lineHeight: 1 }}>:</span>
)

/** Props for the `MathStatement` component. */
export type MathStatementProps = {
    /** The location within the logical structure of a bigger statement where this statement is situated. */
    address: StatementAddress
    /** The statement to render. */
    statement: Statement
    /** The polarity of this statement location (true for positive, false for negative, null for neutral). */
    polarity: boolean | null
}

/**
 * Render a mathematical statement involving logical connectives.
 * 
 * Individual segments are hoverable and clickable to update the selection context.
 * 
 * @param props - `MathStatementProps`
 * @param props.address - The location within the logical structure of a bigger statement
 * @param props.statement - The statement to render
 * @param props.polarity - The polarity of this statement location
 * 
 * @returns A JSX element containing the rendered statement
 */
export function MathStatement({ address, statement, polarity }: MathStatementProps): JSX.Element {
    const { selections, dispatch } = useContext(ProofStateSelectionContext)
    const proofStateLocation = useContext(ProofStateLocationContext)
    const proofStateId = useContext(ProofStateIdContext)
    const [isHovered, setIsHovered] = useState<boolean>(false)
    const locationRgb = getLocationRgb(proofStateLocation.kind)

    // Check if current statement is selected
    const isSelected = selections.some(sel => 
        areProofStateIdsEqual(sel.proofStateId, proofStateId) &&
        sel.location.kind === proofStateLocation.kind &&
        sel.location.label === proofStateLocation.label &&
        areStatementAddressesEqual(sel.address, address) &&
        JSON.stringify(sel.selection) === JSON.stringify(statement)
    )

    // Handle click to toggle selection
    const handleClick = (e: React.MouseEvent) => {
        // Don't stop propagation - allow child expressions to handle clicks first
        // Only handle if the click wasn't already handled by a child
        if (e.defaultPrevented) {
            return
        }
        
        e.preventDefault() // Mark as handled
        
        if (!proofStateLocation) {
            console.warn("Cannot select: missing proofStateLocation context")
            return
        }
        
        dispatch({
            type: 'TOGGLE_SELECTION',
            selection: {
                proofStateId,
                location: proofStateLocation,
                address,
                selection: statement
            }
        })
    }

    // Handle hover
    const handleMouseEnter = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
    }

    // Helper to calculate child polarity based on coordinate
    const getChildPolarity = (coord: StatementCoordinate): boolean | null => {
        const coordPolarity = coordinatePolarity(coord)
        if (coordPolarity === null || polarity === null) {
            return null
        } else {
            return polarity !== coordPolarity
        }
    }

    // Helper to render a child statement with updated address
    const renderChild = (child: Statement, coord: StatementCoordinate): JSX.Element => {
        return <MathStatement 
            address={[...address, coord]} 
            statement={child} 
            polarity={getChildPolarity(coord)}
        />
    }

    // Whether this is a quantifier binding variable (universal_var or existential_var)
    const isQuantifierVar = address.length > 0 &&
        (address[address.length - 1] === "universal_var" || address[address.length - 1] === "existential_var")

    // Style for hoverable/selectable segments based on polarity
    const getPolarityStyles = () => {
        if (!isHovered && !isSelected) {
            return { backgroundColor: 'transparent', border: '1px solid transparent', boxShadow: 'none' }
        }

        if (polarity === true) {
            if (isQuantifierVar) {
                // Quantifier var at positive polarity: reddish outward bevel (variables section shade)
                return {
                    backgroundColor: isSelected ? 'rgba(185,28,28,0.13)' : 'rgba(185,28,28,0.06)',
                    border: isSelected ? '1px solid rgba(185,28,28,0.40)' : '1px solid rgba(185,28,28,0.20)',
                    boxShadow: isSelected
                        ? '0 1px 4px rgba(185,28,28,0.20), inset 0 1px 0 rgba(255,255,255,0.30)'
                        : '0 1px 2px rgba(185,28,28,0.10)',
                }
            }
            // Standard positive: orange outward bevel
            return {
                backgroundColor: isSelected ? 'rgba(255,140,0,0.15)' : 'rgba(255,140,0,0.07)',
                border: isSelected ? '1px solid rgba(255,140,0,0.45)' : '1px solid rgba(255,140,0,0.22)',
                boxShadow: isSelected
                    ? '0 1px 4px rgba(255,140,0,0.20), inset 0 1px 0 rgba(255,255,255,0.30)'
                    : '0 1px 2px rgba(255,140,0,0.12)',
            }
        } else if (polarity === false) {
            if (isQuantifierVar) {
                // Quantifier var at negative polarity: purple inward bevel
                return {
                    backgroundColor: isSelected ? 'rgba(126,34,206,0.13)' : 'rgba(126,34,206,0.06)',
                    border: isSelected ? '1px solid rgba(126,34,206,0.40)' : '1px solid rgba(126,34,206,0.20)',
                    boxShadow: isSelected
                        ? 'inset 0 1px 4px rgba(0,0,0,0.14), inset 0 1px 2px rgba(126,34,206,0.20)'
                        : 'inset 0 1px 2px rgba(0,0,0,0.08)',
                }
            }
            // Standard negative: blue inward bevel
            return {
                backgroundColor: isSelected ? 'rgba(33,150,243,0.13)' : 'rgba(33,150,243,0.06)',
                border: isSelected ? '1px solid rgba(33,150,243,0.45)' : '1px solid rgba(33,150,243,0.22)',
                boxShadow: isSelected
                    ? 'inset 0 1px 4px rgba(0,0,0,0.14), inset 0 1px 2px rgba(33,150,243,0.20)'
                    : 'inset 0 1px 2px rgba(0,0,0,0.08)',
            }
        } else {
            // Null polarity: flat subtle highlight
            return {
                backgroundColor: isSelected ? 'rgba(130,130,130,0.10)' : 'rgba(130,130,130,0.05)',
                border: isSelected ? '1px solid rgba(130,130,130,0.30)' : '1px solid rgba(130,130,130,0.15)',
                boxShadow: 'none',
            }
        }
    }

    const segmentStyle: React.CSSProperties = {
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '3px',
        display: 'inline-block',
        width: 'fit-content',
        transition: 'all 0.15s ease',
        ...getPolarityStyles()
    }

    // Render based on statement type
    if (typeof statement === "string") {
        // Atomic statement
        return (
            <span 
                style={segmentStyle}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <AtomicStatement address={address} input={statement} />
            </span>
        )
    }

    switch (statement.kind) {
        case "conjunction": {
            return (
                <span 
                    style={segmentStyle}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {statement.statements.map((stmt, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <ConjunctionSymbol />}
                            {renderChild(stmt, { kind: "conjunction", idx })}
                        </React.Fragment>
                    ))}
                </span>
            )
        }

        case "disjunction": {
            return (
                <span 
                    style={segmentStyle}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {statement.statements.map((stmt, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <DisjunctionSymbol />}
                            {renderChild(stmt, { kind: "disjunction", idx })}
                        </React.Fragment>
                    ))}
                </span>
            )
        }

        case "negation": {
            return (
                <span 
                    style={segmentStyle}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <NegationSymbol />
                    {renderChild(statement.statement, "negation")}
                </span>
            )
        }

        case "implication": {
            return (
                <span 
                    style={segmentStyle}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {renderChild(statement.antecedent, "implication_antecedent")}
                    <ImplicationSymbol />
                    {renderChild(statement.consequent, "implication_consequent")}
                </span>
            )
        }

        case "equivalence": {
            return (
                <span 
                    style={segmentStyle}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {renderChild(statement.left, "equivalence_left")}
                    <EquivalenceSymbol />
                    {renderChild(statement.right, "equivalence_right")}
                </span>
            )
        }

        case "universal": {
            return (
                <span
                    style={segmentStyle}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <QuantifierGroup rgb={locationRgb}>
                        <QuantifierSymbol src={universalSvg} alt="∀" label="Forall" />
                        {' '}
                        <MathStatement
                            address={[...address, "universal_var"]}
                            statement={statement.variable.name}
                            polarity={getChildPolarity("universal_var")}
                        />
                        <QColon />
                        <MathStatement
                            address={[...address, "universal_var_type"]}
                            statement={statement.variable.description}
                            polarity={getChildPolarity("universal_var_type")}
                        />
                    </QuantifierGroup>
                    {renderChild(statement.statement, "universal_body")}
                </span>
            )
        }

        case "existential": {
            return (
                <span
                    style={segmentStyle}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <QuantifierGroup rgb={locationRgb}>
                        <QuantifierSymbol src={existentialSvg} alt="∃" label="Exists" />
                        {' '}
                        <MathStatement
                            address={[...address, "existential_var"]}
                            statement={statement.variable.name}
                            polarity={getChildPolarity("existential_var")}
                        />
                        <QColon />
                        <MathStatement
                            address={[...address, "existential_var_type"]}
                            statement={statement.variable.description}
                            polarity={getChildPolarity("existential_var_type")}
                        />
                    </QuantifierGroup>
                    {renderChild(statement.statement, "existential_body")}
                </span>
            )
        }

        case "highlight": {
            return (
                <span 
                    style={{
                        ...segmentStyle,
                        backgroundColor: 'rgba(250, 204, 21, 0.2)',
                        borderColor: 'rgba(250, 204, 21, 0.4)'
                    }}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {renderChild(statement.statement, "highlight")}
                </span>
            )
        }

        default: {
            // This should never happen with proper TypeScript checking
            return <span style={{ color: 'red' }}>Unknown statement type</span>
        }
    }
}

