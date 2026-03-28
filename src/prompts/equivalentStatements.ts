import { ProofDiscoverySuggestionMove } from "../core/ProofDiscoveryMove";

export const equivalentStatementsPrompt: ProofDiscoverySuggestionMove = {
    name: "Express in an equivalent form",
    trigger: "This move is relevant when there is a single selection in the proof state, and that selection is a statement that can be reasonably expected to have some non-trivial equivalent reformulations that would be useful for the proof discovery process.",
    suggestionPrompt: "Produce a list of statements that are equivalent to the selected statement, using any additional selections to guide your suggestions.",
    applySuggestionMove: {
        name: "Replace with an equivalent statement",
        kind: "equivalence",
        classification: "mathematical",
        trigger: "",
        action: "This move replaces the selected statement with the equivalent suggestion.",
        examples: []
    }
}
