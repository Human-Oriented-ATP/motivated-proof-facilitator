/** A data-structure representing a sub-expression within a larger expression. */
export type SubExpressionCore = {
  text: string
  source_start: number
  source_end: number
}

/** A sub-expression with extra parameters that 
 * include its location within the underlying source text
 * as well as its bounding box within a rendered SVG. */
export interface SubExpression extends SubExpressionCore {
  text: string
  source_start: number
  source_end: number
  x: number
  y: number
  width: number
  height: number
}

/** An atomic statement is structured as segments of text interspersed with mathematical formulas,
 * and the index points to which formula within the statement this sub-expression corresponds to. */
export interface SubExpressionCoreWithIndex extends SubExpressionCore {
  index: number
}

export function areSubExpressionSelectionsEqual(a: SubExpressionCoreWithIndex, b: SubExpressionCoreWithIndex): boolean {
  return a.text === b.text &&
    a.source_start === b.source_start &&
    a.source_end === b.source_end &&
    a.index === b.index
}