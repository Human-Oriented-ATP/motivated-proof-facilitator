import React, { JSX } from "react"
import { MathExpression } from "./MathExpression"
import { StatementAddress } from "../core/ProofStateSelectionContext"

/** A segment within an atomic statement, either plain text or a mathematical expression. */
type Segment = 
  | { type: "text", content: string }
  | { type: "math", content: string }

/**
 * Parse a string with mathematical expressions delimited by dollar signs ($).
 * 
 * @param input - A string with math expressions like "The value $x + y$ equals $z$"
 * @returns An array of segments alternating between text and math
 * 
 * @example
 * parseAtomicStatement("The value $x + y$ equals $z$")
 * // Returns: [
 * //   { type: "text", content: "The value " },
 * //   { type: "math", content: "x + y" },
 * //   { type: "text", content: " equals " },
 * //   { type: "math", content: "z" }
 * // ]
 */
function parseAtomicStatement(input: string): Segment[] {
  const segments: Segment[] = []
  let currentPos = 0
  let inMath = false
  let segmentStart = 0

  for (let i = 0; i < input.length; i++) {
    if (input[i] === "$") {
      // Extract the segment before this delimiter
      const content = input.substring(segmentStart, i)
      
      if (inMath) {
        // End of math segment
        if (content.length > 0) {
          segments.push({ type: "math", content })
        }
      } else {
        // End of text segment
        if (content.length > 0) {
          segments.push({ type: "text", content })
        }
      }
      
      // Toggle mode and start new segment
      inMath = !inMath
      segmentStart = i + 1
    }
  }

  // Handle remaining content after the last delimiter
  if (segmentStart < input.length) {
    const content = input.substring(segmentStart)
    if (content.length > 0) {
      segments.push({ type: inMath ? "math" : "text", content })
    }
  }

  return segments
}

/** Props for the `AtomicStatement` component. */
export type AtomicStatementProps = {
  /** The location within the logical structure of a larger statement where this atomic statement is situated. */
  address: StatementAddress
  /** The statement text with mathematical expressions delimited by dollar signs ($). */
  input: string
}

/**
 * Render an atomic statement as a combination of text and mathematical expressions.
 * 
 * An atomic statement is a string that may contain mathematical expressions surrounded
 * by dollar signs ($). This component parses the input string, separates text from
 * math expressions, and renders each math expression using the `MathExpression` component.
 * 
 * @param props - `AtomicStatementProps`
 * @param props.address - The location within the logical structure of a larger statement
 * @param props.input - The statement text to be rendered
 * 
 * @returns A JSX element containing the rendered statement with interactive math expressions
 * 
 * @example
 * <AtomicStatement 
 *   address={[]} 
 *   input="The sum $a + b$ is equal to $c$" 
 * />
 */
export function AtomicStatement({ address, input }: AtomicStatementProps): JSX.Element {
  const segments = parseAtomicStatement(input)
  let mathIndex = 0

  return (
    <span>
      {segments.map((segment, idx) => {
        if (segment.type === "text") {
          return <span key={idx}>{segment.content}</span>
        } else {
          const currentMathIndex = mathIndex
          mathIndex++
          return (
            <MathExpression
              key={idx}
              address={address}
              index={currentMathIndex}
              input={segment.content}
            />
          )
        }
      })}
    </span>
  )
}
