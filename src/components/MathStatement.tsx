import React, { JSX, useContext, useState } from "react"
import { Statement } from "../core/ProofState"
import { AtomicStatement } from "./AtomicStatement"
import { StatementAddress, ProofStateSelectionContext, ProofStateLocationContext, areStatementAddressesEqual, StatementCoordinate } from "../core/ProofStateSelectionContext"
import { ProofStateIdContext } from "../core/ProofStateIdContext"

// Import generated logical symbol SVGs
import conjunctionSvg from "../assets/logical-symbols/conjunction.svg?url"
import disjunctionSvg from "../assets/logical-symbols/disjunction.svg?url"
import negationSvg from "../assets/logical-symbols/negation.svg?url"
import implicationSvg from "../assets/logical-symbols/implication.svg?url"
import equivalenceSvg from "../assets/logical-symbols/equivalence.svg?url"
import universalSvg from "../assets/logical-symbols/universal.svg?url"
import existentialSvg from "../assets/logical-symbols/existential.svg?url"

// SVG logical connectives - inline the imported SVGs
const ConjunctionSymbol = () => (
    <img 
        src={conjunctionSvg} 
        alt="∧" 
        style={{ 
            display: 'inline-block', 
            verticalAlign: 'middle', 
            margin: '0 6px',
            height: '1em',
            width: 'auto'
        }} 
    />
)

const DisjunctionSymbol = () => (
    <img 
        src={disjunctionSvg} 
        alt="∨" 
        style={{ 
            display: 'inline-block', 
            verticalAlign: 'middle', 
            margin: '0 6px',
            height: '1em',
            width: 'auto'
        }} 
    />
)

const NegationSymbol = () => (
    <img 
        src={negationSvg} 
        alt="¬" 
        style={{ 
            display: 'inline-block', 
            verticalAlign: 'middle', 
            marginRight: '4px',
            height: '1em',
            width: 'auto'
        }} 
    />
)

const ImplicationSymbol = () => (
    <img 
        src={implicationSvg} 
        alt="⇒" 
        style={{ 
            display: 'inline-block', 
            verticalAlign: 'middle', 
            margin: '0 6px',
            height: '1em',
            width: 'auto'
        }} 
    />
)

const EquivalenceSymbol = () => (
    <img 
        src={equivalenceSvg} 
        alt="⇔" 
        style={{ 
            display: 'inline-block', 
            verticalAlign: 'middle', 
            margin: '0 6px',
            height: '1em',
            width: 'auto'
        }} 
    />
)

const UniversalSymbol = () => (
    <img 
        src={universalSvg} 
        alt="∀" 
        style={{ 
            display: 'inline-block', 
            verticalAlign: 'middle', 
            marginRight: '4px',
            height: '1em',
            width: 'auto'
        }} 
    />
)

const ExistentialSymbol = () => (
    <img 
        src={existentialSvg} 
        alt="∃" 
        style={{ 
            display: 'inline-block', 
            verticalAlign: 'middle', 
            marginRight: '4px',
            height: '1em',
            width: 'auto'
        }} 
    />
)

/** Props for the `MathStatement` component. */
export type MathStatementProps = {
    /** The location within the logical structure of a bigger statement where this statement is situated. */
    address: StatementAddress
    /** The statement to render. */
    statement: Statement
}

/**
 * Render a mathematical statement involving logical connectives.
 * 
 * Individual segments are hoverable and clickable to update the selection context.
 * 
 * @param props - `MathStatementProps`
 * @param props.address - The location within the logical structure of a bigger statement
 * @param props.statement - The statement to render
 * 
 * @returns A JSX element containing the rendered statement
 */
export function MathStatement({ address, statement }: MathStatementProps): JSX.Element {
    const { selections, dispatch } = useContext(ProofStateSelectionContext)
    const proofStateLocation = useContext(ProofStateLocationContext)
    const proofStateId = useContext(ProofStateIdContext)
    const [isHovered, setIsHovered] = useState<boolean>(false)

    // Check if current statement is selected
    const isSelected = selections.some(sel => 
        sel.proofStateId === proofStateId &&
        sel.location.kind === proofStateLocation?.kind &&
        sel.location.label === proofStateLocation?.label &&
        areStatementAddressesEqual(sel.address, address) &&
        sel.selection === statement
    )

    // Handle click to toggle selection
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
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

    // Helper to render a child statement with updated address
    const renderChild = (child: Statement, coord: StatementCoordinate): JSX.Element => {
        return <MathStatement address={[...address, coord]} statement={child} />
    }

    // Style for hoverable/selectable segments
    const segmentStyle: React.CSSProperties = {
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '3px',
        transition: 'background-color 0.15s ease',
        backgroundColor: isSelected 
            ? 'rgba(59, 130, 246, 0.15)' 
            : isHovered 
                ? 'rgba(250, 204, 21, 0.1)' 
                : 'transparent',
        border: isSelected 
            ? '1px solid rgba(59, 130, 246, 0.3)'
            : '1px solid transparent'
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
                    <UniversalSymbol />
                    <MathStatement address={[...address, "universal_var"]} statement={statement.variable.name} />
                    <span style={{ margin: '0 4px' }}>:</span>
                    <MathStatement address={[...address, "universal_var_type"]} statement={statement.variable.description} />
                    <span style={{ margin: '0 6px' }}>.</span>
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
                    <ExistentialSymbol />
                    <MathStatement address={[...address, "existential_var"]} statement={statement.variable.name} />
                    <span style={{ margin: '0 4px' }}>:</span>
                    <MathStatement address={[...address, "existential_var_type"]} statement={statement.variable.description} />
                    <span style={{ margin: '0 6px' }}>.</span>
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

