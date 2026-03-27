import { openrouter } from './provider.js'

export const MODELS = {
    // "openai/gpt-5.4" and "openai/gpt-5.3-chat" were Vercel AI Gateway
    // internal names; substitute with the closest public OpenRouter equivalents.
    "formalize":          openrouter("openai/gpt-4o"),
    "formalize_statement":openrouter("anthropic/claude-sonnet-4-5"),
    "move":               openrouter("openai/gpt-4o"),
    "filter":             openrouter("openai/gpt-4o"),
    "informalize":        openrouter("inception/mercury-2"),
    "suggest":            openrouter("openai/gpt-4o"),
}
