import { ProofDiscoverySuggestionMove } from "../core/ProofDiscoveryMove";

export const hypothesisFowardsReasoningPrompt: ProofDiscoverySuggestionMove = {
    name: "Generate standard consequences of hypothesis",
    trigger: "This move is relevant when the only selection in the proof state is a hypothesis.",
    suggestionPrompt: "Produce a list of statements that are standard consequences of the selected hypothesis, using any additional selections to guide your suggestions.",
    applySuggestionMove: {
        name: "Add a consequence of the hypothesis to the proof state",
        kind: "strengthening",
        trigger: "",
        action: "This move adds the suggested hypothesis to the list of hypotheses in the proof state.",
        examples: []
    }
}