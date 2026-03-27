import { openrouter } from './provider.js'

export const MODELS = {
    "formalize":          openrouter("openai/gpt-4o"),
    "formalize_statement":openrouter("anthropic/claude-3-5-sonnet"),
    "move":               openrouter("openai/gpt-4o"),
    "filter":             openrouter("openai/gpt-4o"),
    "informalize":        openrouter("openai/gpt-4o-mini"),
    "suggest":            openrouter("openai/gpt-4o"),
}
