import { ProofDiscoverySuggestionMove } from "../core/ProofDiscoveryMove";

export const goalBackwardsReasoningPrompt: ProofDiscoverySuggestionMove = {
    name: "Find sufficient conditions for the goal",
    trigger: "This move is relevant when the only selection in the proof state is the goal.",
    suggestionPrompt: "Produce a list of statements that would be sufficient to prove the selected goal, using any additional selections to guide your suggestions.",
    applySuggestionMove: {
        name: "Replace the goal with a sufficient condition",
        kind: "strengthening",
        trigger: "",
        action: "This move replaces the selected goal with the suggested sufficient condition.",
        examples: []
    }
}