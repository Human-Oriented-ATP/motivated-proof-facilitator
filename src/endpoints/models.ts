import { openrouter } from './provider.js'

export const MODELS = {
    "formalize":          openrouter("openai/gpt-5.4"),
    "formalize_statement":openrouter("anthropic/claude-sonnet-4-6"),
    "move":               openrouter("openai/gpt-5.4"),
    "filter":             openrouter("openai/gpt-5.3-chat"),
    "informalize":        openrouter("inception/mercury-2"),
    "suggest":            openrouter("openai/gpt-5.4"),
}
