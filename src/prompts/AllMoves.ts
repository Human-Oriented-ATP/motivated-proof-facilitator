import { goalConjunctionMove } from "../prompts/goalConjunction"
import { goalDisjunctionMove } from "../prompts/goalDisjunction"
import { goalEquivalenceMove } from "../prompts/goalEquivalence"
import { goalExistentialMove } from "../prompts/goalExistential"
import { goalImplicationMove } from "../prompts/goalImplication"
import { goalContradictionMove } from "../prompts/goalContradiction"
import { goalUniversalMove } from "../prompts/goalUniversal"
import { hypothesisConjunctionMove } from "../prompts/hypothesisConjunction"
import { hypothesisDisjunctionMove } from "../prompts/hypothesisDisjunction"
import { hypothesisExistentialMove } from "../prompts/hypothesisExistential"
import { rewritingMove } from "../prompts/rewriting"
import { instantiateMetavariablesMove } from "../prompts/instantiateMetavariables"
import { unfoldDefinitionMove } from "../prompts/unfoldDefinition"
import { simplifyExpressionMove } from "../prompts/simplifyExpression"
import { isolateVariableMove } from "../prompts/isolateVariable"
import { ProofDiscoveryMove, ProofDiscoverySuggestionMove } from "../core/ProofDiscoveryMove"
import { dischargeGoalMove } from "./dischargeGoal"
import { goalDirectedReasoningMove } from "./goalDirectedReasoning"
import { dischargeGoalWithOtherGoalMove } from "./dischargeGoalWithOtherGoal"
import { unifyHypothesisAndGoalMove } from "./unifyHypothesisAndGoal"
import { modusPonensMove } from "./modusPonens"
import { goalBackwardsReasoningPrompt } from "./goalBackwardsReasoning"
import { hypothesisFowardsReasoningPrompt } from "./hypothesisForwardsReasoning"
import { equivalentStatementsPrompt } from "./equivalentStatements"

export const suggestionMoves: ProofDiscoverySuggestionMove[] = [
    equivalentStatementsPrompt,
    hypothesisFowardsReasoningPrompt,
    goalBackwardsReasoningPrompt
]

export const logicalMoves: ProofDiscoveryMove[] = [
    goalConjunctionMove,
    goalDisjunctionMove,
    goalEquivalenceMove,
    goalExistentialMove,
    goalImplicationMove,
    goalUniversalMove,
    hypothesisConjunctionMove,
    hypothesisDisjunctionMove,
    hypothesisExistentialMove,
    instantiateMetavariablesMove,
    unifyHypothesisAndGoalMove,
    modusPonensMove
]
       
export const generalMoves: ProofDiscoveryMove[] = [
    goalContradictionMove,
    rewritingMove,
    unfoldDefinitionMove,
    simplifyExpressionMove,
    isolateVariableMove,
    dischargeGoalMove,
    goalDirectedReasoningMove,
    dischargeGoalWithOtherGoalMove,
]

export const moves = [...generalMoves, ...logicalMoves]